import React, { useState, useEffect } from "react";
import { Camera, Sparkles, MapPin, Upload, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useDispatch } from "react-redux";
import { submitReport } from "../../store/slices/reportsSlice.js";
import { AppDispatch } from "../../store/index.js";
import axiosInstance from "../../api/axiosInstance.js";
import { useGeolocation } from "../../hooks/useGeolocation.js";
import NeoCard from "../ui/NeoCard.js";
import Badge from "../ui/Badge.js";
import SeverityBar from "../ui/SeverityBar.js";

interface ImageReportProps {
  onSuccess?: () => void;
}

export default function ImageReport({ onSuccess }: ImageReportProps) {
  const dispatch = useDispatch<AppDispatch>();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Analysis result state
  const [analysis, setAnalysis] = useState<{
    imageUrl: string;
    category: "Infrastructure" | "Waste" | "Lighting" | "Water" | "Safety" | "Other";
    severity: number;
    description: string;
  } | null>(null);

  const {
    status: geoStatus,
    coordinates: geoCoordinates,
    detectedAddress: geoDetectedAddress,
    error: geoError,
    retry: retryGeo
  } = useGeolocation();

  // Form editable state
  const [title, setTitle] = useState("");
  const [address, setAddress] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [editableDescription, setEditableDescription] = useState("");

  const handleDiscard = () => {
    setImageFile(null);
    setImagePreview(null);
    setAnalysis(null);
    setTitle("");
    setAddress("");
    setEditableDescription("");
    setErrorMsg(null);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setAnalyzing(true);
    setAnalysis(null);
    setErrorMsg(null);

    // Formulate title preview from filename
    const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
    setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));

    try {
      const formData = new FormData();
      formData.append("image", file);

      // Post to analyze endpoint
      const res = await axiosInstance.post("/reports/analyze-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (res.data.success) {
        setAnalysis({
          imageUrl: res.data.imageUrl,
          category: res.data.category,
          severity: Number(res.data.severity),
          description: res.data.description
        });
        setEditableDescription(res.data.description || "");
      } else {
        throw new Error(res.data.message || "Analysis failed");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Failed to analyze image using Gemini AI. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      processFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!analysis || !title) return;

    setSubmitting(true);
    try {
      const reportPayload = {
        title,
        description: editableDescription.trim() || analysis.description,
        category: analysis.category,
        severity: analysis.severity,
        imageUrl: analysis.imageUrl,
        location: {
          coordinates: geoCoordinates || [0, 0],
          address: address.trim() || geoDetectedAddress || "Manual Address Input Needed"
        }
      };

      const resultAction = await dispatch(submitReport(reportPayload));
      if (submitReport.fulfilled.match(resultAction)) {
        // Clear states
        setImageFile(null);
        setImagePreview(null);
        setAnalysis(null);
        setTitle("");
        setAddress("");
        setEditableDescription("");
        // Trigger success callback to show toast
        onSuccess?.();
      } else {
        setErrorMsg("Failed to submit report. Ensure your session is valid.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white border-2 border-gray-200 rounded-3xl p-6">
      <div className="flex items-center space-x-2 mb-4">
        <div className="p-2 bg-emerald-50 rounded-xl text-[#58cc02]">
          <Camera className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-gray-800">Snap & Assess</h2>
          <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider">AI Vision Assessment</p>
        </div>
      </div>

      {/* Error Indicator */}
      {errorMsg && (
        <div className="mb-4 bg-red-50 border border-red-100 rounded-xl p-3 flex items-start space-x-2 text-xs text-red-600 font-medium">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drag & Drop File Select Area */}
      {!imagePreview && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-3 border-dashed border-[#84d640] hover:border-[#58cc02] rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition bg-emerald-50/20 group h-52 relative"
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="p-4 bg-emerald-100/50 rounded-full text-[#58cc02] group-hover:scale-110 transition mb-3">
            <Upload className="w-7 h-7" />
          </div>
          <p className="text-xs font-bold text-gray-700">Drag issue photo here or click to select</p>
          <p className="text-[10px] text-gray-400 mt-1 font-semibold">Supports PNG, JPG, WEBP (Max 10MB)</p>
        </div>
      )}

      {/* Image Preview & Analyzing spinner */}
      {imagePreview && (
        <div className="mb-5 relative rounded-2xl overflow-hidden border border-gray-200 max-h-56 bg-gray-50 flex items-center justify-center">
          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
          
          {/* AI Analyzing Ring Spinner */}
          {analyzing && (
            <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex flex-col items-center justify-center">
              <div className="relative w-16 h-16 mb-3">
                <div className="absolute inset-0 rounded-full border-4 border-[#84d640]/30 animate-pulse" />
                <div className="absolute inset-0 rounded-full border-4 border-t-[#58cc02] animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-5 h-5 text-[#58cc02] animate-bounce" />
              </div>
              <p className="text-xs font-extrabold text-[#46a302] tracking-wide animate-pulse">Gemini AI analyzing issue...</p>
            </div>
          )}
        </div>
      )}

      {/* AI Analysis Form Controls */}
      {analysis && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#58cc02]" />
              <span className="text-xs font-extrabold text-emerald-800 tracking-wide uppercase">AI Summary Generated</span>
            </div>

            <div className="space-y-3">
              {/* Category pill */}
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-gray-500">Category:</span>
                <Badge label={analysis.category} variant={analysis.category} />
              </div>

              {/* Severity bar */}
              <div>
                <SeverityBar severity={analysis.severity} />
              </div>

              {/* Description box */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">AI Refined Copy (Editable)</label>
                <textarea
                  value={editableDescription}
                  onChange={(e) => setEditableDescription(e.target.value)}
                  placeholder="Describe the issue in detail..."
                  rows={3}
                  className="w-full bg-white border border-emerald-100 focus:border-[#58cc02] rounded-xl p-2.5 text-xs text-gray-700 font-medium outline-none transition resize-none shadow-sm"
                />
              </div>
            </div>
          </div>

          {/* Title input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Report Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Broken pavement on Pine St."
              className="w-full bg-white border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-2 px-3 text-xs font-bold outline-none transition"
            />
          </div>

          {/* Location / Address editable input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center space-x-1">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              <span>Report Location / Address</span>
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Enter city, landmark, PIN code, or address..."
              className="w-full bg-white border-2 border-gray-200 focus:border-[#58cc02] rounded-xl py-2 px-3 text-xs font-medium outline-none transition"
            />
          </div>

          {/* Submit Action & Discard option */}
          <div className="flex space-x-3 mt-4">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={submitting}
              className="flex-1 py-3.5 text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition duration-200 cursor-pointer"
            >
              Discard Draft
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-[2] py-3.5 btn-bouncy text-xs flex items-center justify-center space-x-1"
            >
              {submitting ? (
                <span>Submitting to Civic Feed...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Submit Report +10 🪙</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
