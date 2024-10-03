import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ImageIcon, X } from "lucide-react";
import { fallbackNameGenerator } from "@/lib/utils";

interface PostComposerProps {
  onPostSubmit: (content: string, media?: File) => void;
  userAvatarSrc?: string;
  userAvatarFallback?: string;
}

export default function PostComposer({
  onPostSubmit,
  userAvatarSrc = "/placeholder-user.jpg",
  userAvatarFallback = "UN",
}: PostComposerProps) {
  const [postContent, setPostContent] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePostSubmit = () => {
    if (postContent.trim()) {
      onPostSubmit(postContent, selectedMedia || undefined);
      setPostContent("");
      setSelectedMedia(null);
      setPreviewUrl(null);
    }
  };

  const handleMediaSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const blobUrl = URL.createObjectURL(file);
      setPreviewUrl(blobUrl);
    }
  };

  const handleIconClick = () => {
    fileInputRef.current?.click();
  };

  const removeMedia = () => {
    setSelectedMedia(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="bg-white w-full dark:bg-gray-800 p-4 rounded-lg shadow mb-6">
      <div className="flex items-start space-x-4">
        <Avatar>
          <AvatarImage src={userAvatarSrc} alt="User avatar" />
          <AvatarFallback>
            {fallbackNameGenerator(userAvatarFallback)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-grow">
          <Input
            placeholder="What is happening?!"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            className="w-full mb-2 bg-transparent border-none text-lg placeholder-gray-500 focus:outline-none dark:text-white dark:placeholder-gray-400"
            aria-label="Post content"
          />
          {previewUrl && (
            <div className="relative mb-2 group">
              {selectedMedia?.type.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="Selected media"
                  className="max-w-full h-auto rounded"
                />
              ) : (
                <video
                  src={previewUrl}
                  controls
                  className="max-w-full h-auto rounded"
                >
                  Your browser does not support the video tag.
                </video>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="absolute transition-all top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white opacity-0 group-hover:opacity-100 duration-200 ease-in-out"
                onClick={removeMedia}
                aria-label="Remove media"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*,video/*"
                onChange={handleMediaSelect}
              />
              <Button
                variant="ghost"
                size="icon"
                onClick={handleIconClick}
                aria-label="Add image or video"
              >
                <ImageIcon className="h-5 w-5 text-blue-400" />
              </Button>
            </div>
            <Button
              onClick={handlePostSubmit}
              disabled={!postContent.trim()}
              className="bg-green-600 hover:bg-green-700 text-white dark:bg-green-700 dark:hover:bg-green-800"
            >
              Post
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}