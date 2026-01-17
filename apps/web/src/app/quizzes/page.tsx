"use client";

import { useState, useCallback } from "react";
import { useDropzone, FileRejection } from "react-dropzone";
import { motion, AnimatePresence } from "framer-motion";

interface UploadedFile extends File {
  path?: string;
}

export default function QuizzesPage() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      setFiles((prev) => {
        const combined = [...prev, ...acceptedFiles] as UploadedFile[];
        return combined.slice(0, 4);
      });
    },
    []
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } =
    useDropzone({
      onDrop,
      maxFiles: 4,
      accept: {
        "application/pdf": [".pdf"],
        "text/plain": [".txt"],
        "application/msword": [".doc"],
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          [".docx"],
        "image/*": [".png", ".jpg", ".jpeg"],
      },
    });

  const removeFile = (fileToRemove: UploadedFile) => {
    setFiles(files.filter((file) => file !== fileToRemove));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (files.length === 0) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsSubmitting(false);
    setIsSuccess(true);

    // Reset after showing success
    setTimeout(() => {
      setFiles([]);
      setIsSuccess(false);
    }, 3000);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    switch (ext) {
      case "pdf":
        return "📄";
      case "doc":
      case "docx":
        return "📝";
      case "txt":
        return "📃";
      case "png":
      case "jpg":
      case "jpeg":
        return "🖼️";
      default:
        return "📎";
    }
  };

  return (
    <main className="relative pt-24 pb-20 min-h-screen">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <span className="badge mb-4">AI-Powered</span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
            <span className="text-white">Generate </span>
            <span className="text-gradient">Smart Quizzes</span>
          </h1>
          <p className="text-white/60 text-lg md:text-xl max-w-2xl mx-auto">
            Upload your study materials and let our AI create personalized
            quizzes, flashcards, and summaries instantly.
          </p>
        </motion.div>

        {/* Main content */}
        <div className="max-w-3xl mx-auto">
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`relative rounded-2xl p-8 md:p-12 border-2 border-dashed transition-all duration-300 cursor-pointer ${
                isDragActive
                  ? "border-indigo-500 bg-indigo-500/10"
                  : files.length >= 4
                  ? "border-white/10 bg-white/5 cursor-not-allowed opacity-50"
                  : "border-white/20 hover:border-indigo-500/50 hover:bg-white/5"
              }`}
            >
              <input {...getInputProps()} disabled={files.length >= 4} />

              <div className="text-center">
                <motion.div
                  animate={isDragActive ? { scale: 1.1, y: -10 } : { scale: 1, y: 0 }}
                  className="text-6xl mb-4"
                >
                  {isDragActive ? "📥" : "📤"}
                </motion.div>

                <h3 className="text-xl font-semibold text-white mb-2">
                  {isDragActive
                    ? "Drop your files here"
                    : "Drag & drop your study materials"}
                </h3>
                <p className="text-white/50 mb-4">
                  or click to browse from your computer
                </p>

                <div className="flex flex-wrap justify-center gap-2 text-xs text-white/40">
                  <span className="px-2 py-1 rounded-full glass">PDF</span>
                  <span className="px-2 py-1 rounded-full glass">DOC</span>
                  <span className="px-2 py-1 rounded-full glass">TXT</span>
                  <span className="px-2 py-1 rounded-full glass">Images</span>
                </div>

                <p className="mt-4 text-sm text-white/40">
                  Maximum 4 files · {files.length}/4 uploaded
                </p>
              </div>

              {/* Progress ring around dropzone during upload */}
              {isSubmitting && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mb-4" />
                    <p className="text-white font-medium">Processing your files...</p>
                  </div>
                </div>
              )}

              {/* Success state */}
              <AnimatePresence>
                {isSuccess && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-2xl"
                  >
                    <div className="text-center">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", duration: 0.5 }}
                        className="text-6xl mb-4"
                      >
                        ✅
                      </motion.div>
                      <h3 className="text-xl font-bold text-white mb-2">
                        Quiz Generated!
                      </h3>
                      <p className="text-white/60">
                        Your study materials are ready
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* File list */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-white font-medium">
                      Files ready ({files.length}/4)
                    </h4>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-sm text-red-400 hover:text-red-300 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  <div className="space-y-2">
                    {files.map((file, index) => (
                      <motion.div
                        key={file.name + index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 rounded-xl glass group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{getFileIcon(file.name)}</span>
                          <div>
                            <p className="text-white text-sm font-medium truncate max-w-[200px] sm:max-w-none">
                              {file.name}
                            </p>
                            <p className="text-white/40 text-xs">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          type="button"
                          onClick={() => removeFile(file)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Rejected files */}
            {fileRejections.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 rounded-xl bg-red-500/10 border border-red-500/20"
              >
                <h4 className="text-red-400 font-medium mb-2">
                  Some files were rejected
                </h4>
                <ul className="space-y-1">
                  {fileRejections.map(
                    ({ file, errors }: FileRejection, index) => (
                      <li key={index} className="text-sm text-red-300/80">
                        {file.name} -{" "}
                        {errors.map((e) => e.message).join(", ")}
                      </li>
                    )
                  )}
                </ul>
              </motion.div>
            )}

            {/* Submit button */}
            <motion.button
              whileHover={{ scale: files.length > 0 ? 1.02 : 1 }}
              whileTap={{ scale: files.length > 0 ? 0.98 : 1 }}
              type="submit"
              disabled={files.length === 0 || isSubmitting}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-300 ${
                files.length === 0 || isSubmitting
                  ? "glass text-white/40 cursor-not-allowed"
                  : "btn-primary"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating Quiz...
                </span>
              ) : (
                `Generate Quiz from ${files.length} File${files.length !== 1 ? "s" : ""}`
              )}
            </motion.button>
          </motion.form>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6"
          >
            {[
              {
                icon: "🧠",
                title: "Smart Analysis",
                description: "AI understands context and key concepts",
              },
              {
                icon: "⚡",
                title: "Instant Results",
                description: "Get quizzes in seconds, not hours",
              },
              {
                icon: "📊",
                title: "Track Progress",
                description: "See how you improve over time",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                className="text-center p-6 rounded-xl glass"
              >
                <div className="text-3xl mb-3">{feature.icon}</div>
                <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                <p className="text-white/50 text-sm">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* How it works */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="mt-16 text-center"
          >
            <h2 className="text-2xl font-bold text-white mb-8">What you&apos;ll get</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: "❓", label: "Multiple Choice" },
                { icon: "📝", label: "Fill in Blanks" },
                { icon: "🎴", label: "Flashcards" },
                { icon: "📋", label: "Summary Notes" },
              ].map((item, index) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  className="p-4 rounded-xl glass cursor-pointer group"
                >
                  <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                    {item.icon}
                  </div>
                  <p className="text-white/70 text-sm">{item.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
