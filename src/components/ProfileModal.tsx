import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, Upload, Music, Image, FileText, Download, Play, Pause } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface GeneratedTrack {
  id: string;
  audioUrl: string;
  streamAudioUrl: string;
  imageUrl: string;
  prompt: string;
  title: string;
  tags: string;
  duration: number;
  createTime: string;
}

interface TaskStatus {
  taskId: string;
  status: string;
  response?: {
    sunoData?: GeneratedTrack[];
  };
  errorMessage?: string;
}

export default function KieMusicGenerator() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [coinBalance, setCoinBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [taskStatus, setTaskStatus] = useState<TaskStatus | null>(null);
  const [generatedTracks, setGeneratedTracks] = useState<GeneratedTrack[]>([]);
  const [generatedLyrics, setGeneratedLyrics] = useState<string | null>(null);
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [audioElements, setAudioElements] = useState<{ [key: string]: HTMLAudioElement }>({});

  // Form states
  const [mode, setMode] = useState<"description" | "custom" | "image">("description");
  const [prompt, setPrompt] = useState("");
  const [customLyrics, setCustomLyrics] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [style, setStyle] = useState("");
  const [title, setTitle] = useState("");
  const [instrumental, setInstrumental] = useState(false);
  const [model, setModel] = useState("V4_5");

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (taskId && !["SUCCESS", "FIRST_SUCCESS"].includes(taskStatus?.status || "")) {
      interval = setInterval(() => {
        checkTaskStatus();
      }, 10000); // Check every 10 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [taskId, taskStatus?.status]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    loadCoinBalance(user);
  };

  const loadCoinBalance = async (currentUser: any) => {
    const { data } = await supabase
      .from("earth_coins")
      .select("balance")
      .eq("user_id", currentUser.id)
      .single();

    if (data) {
      setCoinBalance(data.balance);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("Image size must be less than 10MB");
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getCoinCost = () => {
    switch (mode) {
      case "image": return 50;
      case "custom": return 30;
      default: return 20;
    }
  };

  const validateForm = () => {
    if (mode === "description" && !prompt.trim()) {
      toast.error("Please enter a music description");
      return false;
    }
    if (mode === "custom" && !customLyrics.trim()) {
      toast.error("Please enter custom lyrics");
      return false;
    }
    if (mode === "image" && !imageFile) {
      toast.error("Please upload an image");
      return false;
    }
    return true;
  };

  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (!validateForm()) return;
    const coinCost = getCoinCost();
    if (coinBalance < coinCost) {
      toast.error(`Insufficient Earth Coins. Need ${coinCost} coins for ${mode} mode.`);
      return;
    }
    setIsLoading(true);
    setGeneratedTracks([]);
    setGeneratedLyrics(null);
    setTaskStatus(null);

    try {
      let imageBase64 = null;
      if (mode === "image" && imageFile) {
        imageBase64 = await convertImageToBase64(imageFile);
      }

      const { data, error } = await supabase.functions.invoke("kie-music-generator", {
        body: {
          mode,
          prompt: mode === "description" ? prompt : undefined,
          customLyrics: mode === "custom" ? customLyrics : undefined,
          imageBase64,
          style: (mode === "custom" || mode === "image") ? style : undefined,
          title: (mode === "custom" || mode === "image") ? title : undefined,
          instrumental: mode !== "image" ? instrumental : false,
          model
        }
      });

      if (error) throw error;

      if (data.success) {
        setTaskId(data.data.taskId);
        setGeneratedLyrics(data.generated_lyrics);
        setCoinBalance(prev => prev - data.coins_spent);
        toast.success(`Music generation started! ${data.coins_spent} Earth Coins spent.`);
        setTaskStatus({ taskId: data.data.taskId, status: "PENDING" });
      } else {
        throw new Error(data.error || "Generation failed");
      }
    } catch (error: any) {
      console.error("Generation error:", error);
      toast.error(error.message || "Failed to generate music");
    } finally {
      setIsLoading(false);
    }
  };

  const checkTaskStatus = async () => {
    if (!taskId) return;

    try {
      const { data, error } = await supabase.functions.invoke("kie-music-status", {
        body: { taskId }
      });

      console.log("Status check response:", data, error); // Debug log

      if (error) throw error;

      if (data.success) {
        setTaskStatus(data.data);

        if (data.data.status === "SUCCESS" || data.data.status === "FIRST_SUCCESS") {
          if (data.data.response?.sunoData) {
            console.log("Generated tracks:", data.data.response.sunoData); // Debug log
            setGeneratedTracks(data.data.response.sunoData);
            toast.success("Music generation completed!");
          }
        } else if (data.data.status.includes("FAILED") || data.data.status.includes("ERROR")) {
          toast.error(`Generation failed: ${data.data.errorMessage || data.data.status}`);
        }
      }
    } catch (error: any) {
      console.error("Status check error:", error);
      toast.error("Failed to check generation status");
    }
  };

  const togglePlayPause = (track: GeneratedTrack) => {
    const audioKey = track.id;

    if (currentlyPlaying === audioKey) {
      if (audioElements[audioKey]) {
        audioElements[audioKey].pause();
      }
      setCurrentlyPlaying(null);
    } else {
      if (currentlyPlaying && audioElements[currentlyPlaying]) {
        audioElements[currentlyPlaying].pause();
      }

      if (!audioElements[audioKey]) {
        const audio = new Audio(track.audioUrl);
        audio.onended = () => setCurrentlyPlaying(null);
        setAudioElements(prev => ({ ...prev, [audioKey]: audio }));
        audio.play();
      } else {
        audioElements[audioKey].play();
      }
      setCurrentlyPlaying(audioKey);
    }
  };

  const downloadTrack = (track: GeneratedTrack) => {
    const link = document.createElement("a");
    link.href = track.audioUrl;
    link.download = `${track.title || "generated-music"}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Download started!");
  };

  const getStatusMessage = () => {
    if (!taskStatus) return null;

    console.log("Current task status:", taskStatus.status); // Debug log

    switch (taskStatus.status) {
      case "PENDING":
        return "Generating music... This may take 1-3 minutes.";
      case "TEXT_SUCCESS":
        return "Lyrics generated! Creating audio...";
      case "FIRST_SUCCESS":
        return "First track completed! Generating second track...";
      case "SUCCESS":
        return "All tracks generated successfully!";
      default:
        if (taskStatus.status.includes("FAILED") || taskStatus.status.includes("ERROR")) {
          return `Generation failed: ${taskStatus.errorMessage || taskStatus.status}`;
        }
        return `Status: ${taskStatus.status}`;
    }
  };

  const resetForm = () => {
    setPrompt("");
    setCustomLyrics("");
    setImageFile(null);
    setImagePreview(null);
    setStyle("");
    setTitle("");
    setInstrumental(false);
    setTaskId(null);
    setTaskStatus(null);
    setGeneratedTracks([]);
    setGeneratedLyrics(null);
    setCurrentlyPlaying(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-First Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/ai-lab")}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Back to AI Lab</span>
              <span className="sm:hidden">Back</span>
            </Button>

            {/* Mobile Coin Display */}
            <div className="flex items-center gap-2 bg-card border rounded-full px-3 py-1.5">
              <span className="text-yellow-500">🪙</span>
              <span className="font-semibold text-sm">{coinBalance}</span>
              <span className="text-xs text-muted-foreground hidden sm:inline">Coins</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-4 pb-20">
        {/* Mobile-First Title Section */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-2">
            AI Music Generator
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Create amazing music with AI - from descriptions, lyrics, or images
          </p>
        </div>

        {/* Main Content Card */}
        <Card className="max-w-4xl mx-auto">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg sm:text-xl">Create Your Music</CardTitle>
            <CardDescription className="text-sm">
              Choose your generation mode and let AI create your perfect soundtrack
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Mobile-First Mode Selection */}
            <Tabs value={mode} onValueChange={(value) => setMode(value as any)} className="w-full">
              {/* Mobile Tab Layout */}
              <div className="space-y-2 sm:space-y-0">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 h-auto p-1 gap-1 sm:gap-0">
                  <TabsTrigger value="description" className="w-full p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      <span className="hidden sm:inline">Description</span>
                      <span className="sm:hidden">Desc</span>
                      <span className="text-xs">({getCoinCost()} 🪙)</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="custom" className="w-full p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      <span className="hidden sm:inline">Custom Lyrics</span>
                      <span className="sm:hidden">Lyrics</span>
                      <span className="text-xs">(30 🪙)</span>
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="image" className="w-full p-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      <span className="hidden sm:inline">Image to Music</span>
                      <span className="sm:hidden">Image</span>
                      <span className="text-xs">(50 🪙)</span>
                    </div>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Description Mode - Mobile Optimized */}
              <TabsContent value="description" className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="prompt" className="text-sm font-medium">Music Description</Label>
                  <Textarea
                    id="prompt"
                    placeholder="Describe the music you want... e.g., 'A calming piano piece with soft melodies for relaxation'"
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="mt-1 min-h-[100px] text-sm"
                    rows={4}
                  />
                </div>
              </TabsContent>

              {/* Custom Lyrics Mode - Mobile Optimized */}
              <TabsContent value="custom" className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="lyrics" className="text-sm font-medium">Custom Lyrics</Label>
                  <Textarea
                    id="lyrics"
                    placeholder="Enter your custom lyrics here..."
                    value={customLyrics}
                    onChange={(e) => setCustomLyrics(e.target.value)}
                    className="mt-1 min-h-[120px] text-sm"
                    rows={6}
                  />
                </div>

                {/* Mobile-First Grid for Style/Title */}
                <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                  <div>
                    <Label htmlFor="style" className="text-sm font-medium">Music Style</Label>
                    <Input
                      id="style"
                      placeholder="e.g., Pop, Rock, Jazz, Classical"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="title" className="text-sm font-medium">Song Title</Label>
                    <Input
                      id="title"
                      placeholder="Enter song title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>

              {/* Image Mode - Mobile Optimized */}
              <TabsContent value="image" className="space-y-4 mt-6">
                <div>
                  <Label htmlFor="image" className="text-sm font-medium">Upload Image</Label>
                  <div className="border-2 border-dashed border-border rounded-lg p-4 sm:p-6 text-center mt-1">
                    {imagePreview ? (
                      <div className="space-y-4">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="max-w-full max-h-48 mx-auto rounded-lg"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview(null);
                          }}
                        >
                          Remove Image
                        </Button>
                      </div>
                    ) : (
                      <div>
                        <Upload className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-3 text-muted-foreground" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                          id="image-upload"
                        />
                        <label htmlFor="image-upload">
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <span>Choose Image</span>
                          </Button>
                        </label>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-2">
                          AI will analyze your image and create lyrics + music
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Optional fields for image mode */}
                <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
                  <div>
                    <Label htmlFor="image-style" className="text-sm font-medium">Music Style (Optional)</Label>
                    <Input
                      id="image-style"
                      placeholder="e.g., Folk, Electronic, Ambient"
                      value={style}
                      onChange={(e) => setStyle(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="image-title" className="text-sm font-medium">Song Title (Optional)</Label>
                    <Input
                      id="image-title"
                      placeholder="Leave empty for AI to decide"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1 text-sm"
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Advanced Options - Mobile Optimized */}
            {mode !== "image" && (
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm">Advanced Options</h3>
                <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0 sm:items-end">
                  <div>
                    <Label htmlFor="model" className="text-sm font-medium">AI Model</Label>
                    <Select value={model} onValueChange={setModel}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="V3_5">V3.5 - Better structure</SelectItem>
                        <SelectItem value="V4">V4 - Improved vocals</SelectItem>
                        <SelectItem value="V4_5">V4.5 - Smart prompts</SelectItem>
                        <SelectItem value="V4_5PLUS">V4.5+ - Richer sound</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-background rounded border">
                    <Label htmlFor="instrumental" className="text-sm font-medium">Instrumental Only</Label>
                    <Switch
                      id="instrumental"
                      checked={instrumental}
                      onCheckedChange={setInstrumental}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button - Mobile Optimized */}
            <Button
              onClick={handleGenerate}
              disabled={isLoading || !validateForm() || coinBalance < getCoinCost()}
              className="w-full h-12 text-sm sm:text-base"
              size="lg"
            >
              {isLoading ? "Generating..." : `Generate Music (${getCoinCost()} 🪙)`}
            </Button>

            {/* Status Display - Mobile Optimized */}
            {taskStatus && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Generation Status</span>
                  <Badge variant={taskStatus.status === "SUCCESS" ? "default" : "secondary"} className="text-xs">
                    {taskStatus.status}
                  </Badge>
                </div>
                {taskStatus.status === "PENDING" && (
                  <div className="space-y-2">
                    <Progress value={undefined} className="w-full h-2" />
                    <p className="text-muted-foreground text-xs sm:text-sm">{getStatusMessage()}</p>
                  </div>
                )}
                {getStatusMessage() && taskStatus.status !== "PENDING" && (
                  <p className="text-muted-foreground text-xs sm:text-sm">{getStatusMessage()}</p>
                )}
              </div>
            )}

            {/* Generated Lyrics Display - Mobile Optimized */}
            {generatedLyrics && (
              <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm">Generated Lyrics from Image</h3>
                <pre className="text-muted-foreground text-xs sm:text-sm whitespace-pre-wrap overflow-auto max-h-40">
                  {generatedLyrics}
                </pre>
              </div>
            )}

            {/* Generated Tracks - Mobile Optimized */}
            {generatedTracks.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm sm:text-base">Generated Music</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetForm}
                  >
                    Create New
                  </Button>
                </div>

                <div className="space-y-3">
                  {generatedTracks.map((track, index) => (
                    <Card key={track.id}>
                      <CardContent className="p-4">
                        {/* Mobile-First Track Layout */}
                        <div className="space-y-3 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
                          {track.imageUrl && (
                            <img
                              src={track.imageUrl}
                              alt={track.title}
                              className="w-full sm:w-16 h-32 sm:h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0 space-y-1">
                            <h4 className="font-medium text-sm sm:text-base truncate">{track.title}</h4>
                            <p className="text-muted-foreground text-xs sm:text-sm">{track.tags}</p>
                            <p className="text-muted-foreground text-xs">Duration: {Math.floor(track.duration)}s</p>
                          </div>

                          {/* Mobile Controls */}
                          <div className="flex items-center justify-center space-x-2 sm:flex-col sm:space-x-0 sm:space-y-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => togglePlayPause(track)}
                              className="flex-1 sm:flex-none"
                            >
                              {currentlyPlaying === track.id ? (
                                <>
                                  <Pause className="w-4 h-4 sm:mr-0 mr-2" />
                                  <span className="sm:hidden">Pause</span>
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 sm:mr-0 mr-2" />
                                  <span className="sm:hidden">Play</span>
                                </>
                              )}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => downloadTrack(track)}
                              className="flex-1 sm:flex-none"
                            >
                              <Download className="w-4 h-4 sm:mr-0 mr-2" />
                              <span className="sm:hidden">Download</span>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
