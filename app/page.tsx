"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Image as ImageIcon, Link as LinkIcon, BarChart3, Settings, LogOut, Loader2, Save } from "lucide-react";

// Types
interface Ad {
  id: string;
  type: "custom" | "network";
  title: string;
  code?: string;
  imageUrl?: string;
  targetUrl?: string;
  views: number;
}

interface SettingsData {
  progressiveDelays: number[];
  sessionDuration: number;
}

export default function Dashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState("");
  const [ads, setAds] = useState<Ad[]>([]);
  const [settings, setSettings] = useState<SettingsData>({ progressiveDelays: [5, 12, 24], sessionDuration: 3600 });
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [imgbbKey, setImgbbKey] = useState("");
  const [error, setError] = useState("");

  // UI State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAd, setNewAd] = useState<Partial<Ad>>({ type: "custom", title: "" });

  useEffect(() => {
    fetchAds();
  }, []);

  const fetchAds = async () => {
    try {
      const res = await fetch("/api/get-ad");
      const data = await res.json();
      if (data.ads) setAds(data.ads);
      if (data.settings) setSettings(data.settings);
    } catch (e) {
      console.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin123") { // Matches implementation plan default
      setIsLoggedIn(true);
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const saveToRedis = async (action: string, data: any) => {
    setUpdating(true);
    try {
      const res = await fetch("/api/update", {
        method: "POST",
        body: JSON.stringify({ action, data, password })
      });
      if (!res.ok) throw new Error("Update failed");
      fetchAds();
    } catch (e) {
      alert("Operation failed. Check server logs.");
    } finally {
      setUpdating(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !imgbbKey) {
        alert("Please provide an ImgBB API key first!");
        return;
    }

    setUpdating(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbKey}`, {
        method: "POST",
        body: formData
      });
      const data = await res.json();
      if (data.data?.url) {
        setNewAd({ ...newAd, imageUrl: data.data.url });
      }
    } catch (e) {
      alert("Image upload failed");
    } finally {
      setUpdating(false);
    }
  };

  const addAd = () => {
    const ad: Ad = {
      id: Math.random().toString(36).substr(2, 9),
      views: 0,
      title: newAd.title || "Untitled Ad",
      type: newAd.type || "custom",
      ...newAd
    } as Ad;

    const updatedAds = [...ads, ad];
    setAds(updatedAds);
    saveToRedis("save_ads", updatedAds);
    setShowAddModal(false);
    setNewAd({ type: "custom", title: "" });
  };

  const deleteAd = (id: string) => {
    if (!confirm("Are you sure?")) return;
    const updatedAds = ads.filter(a => a.id !== id);
    setAds(updatedAds);
    saveToRedis("save_ads", updatedAds);
  };

  if (loading) return <div className="flex items-center justify-center h-screen"><Loader2 className="animate-spin text-indigo-600" /></div>;

  if (!isLoggedIn) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="glass p-10 rounded-[32px] shadow-2xl w-full max-w-md animate-in">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">AdCenter Login</h1>
            <p className="text-slate-500 mt-2">Manage your serverless ad network</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter Password" 
              className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
            <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:scale-[1.02] transition-all">
              Unlock Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 lg:p-10 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800">Admin Dashboard</h1>
          <p className="text-slate-500">Overview of your active campaigns and analytics</p>
        </div>
        <div className="flex items-center gap-3">
            <button onClick={() => setShowAddModal(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all">
                <Plus size={20} /> New Ad
            </button>
            <button onClick={() => setIsLoggedIn(false)} className="p-3 bg-white rounded-2xl text-slate-400 hover:text-red-500 border border-slate-200 transition-all">
                <LogOut size={20} />
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ad List */}
        <div className="lg:col-span-2 space-y-6">
          {ads.length === 0 && (
            <div className="glass p-20 rounded-[32px] text-center">
              <BarChart3 size={48} className="mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">No ads configured. Create your first one!</p>
            </div>
          )}
          {ads.map(ad => (
            <div key={ad.id} className="glass p-6 rounded-[32px] shadow-sm hover:shadow-md transition-all flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white rounded-2xl border border-slate-100 flex items-center justify-center overflow-hidden">
                  {ad.type === 'custom' ? <img src={ad.imageUrl} className="object-cover w-full h-full" /> : <BarChart3 className="text-indigo-500" />}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800">{ad.title}</h3>
                  <p className="text-xs text-slate-400 uppercase font-bold">{ad.type} Ad</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-right">
                    <p className="text-sm font-bold text-slate-500">Views</p>
                    <p className="text-xl font-black text-indigo-600">{ad.views}</p>
                </div>
                <button onClick={() => deleteAd(ad.id)} className="p-3 text-slate-300 hover:text-red-500 transition-all">
                  <Trash2 size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Settings Sidebar */}
        <div className="space-y-6">
            <div className="glass p-8 rounded-[32px] shadow-xl">
                <div className="flex items-center gap-2 mb-6">
                    <Settings name="settings" size={20} className="text-indigo-600" />
                    <h2 className="text-xl font-bold">Config</h2>
                </div>
                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">ImgBB API Key</label>
                        <input 
                            type="text" 
                            value={imgbbKey} 
                            onChange={e => setImgbbKey(e.target.value)}
                            placeholder="Required for uploads"
                            className="w-full mt-1 px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase ml-1">Progressive Delays (sec)</label>
                        <div className="flex gap-2 mt-1">
                            {settings.progressiveDelays.map((d, i) => (
                                <input 
                                    key={i} 
                                    type="number" 
                                    value={d} 
                                    onChange={e => {
                                        const newDelays = [...settings.progressiveDelays];
                                        newDelays[i] = parseInt(e.target.value);
                                        setSettings({...settings, progressiveDelays: newDelays});
                                    }}
                                    className="w-1/3 px-2 py-3 bg-white/50 border border-slate-200 rounded-xl text-center outline-none"
                                />
                            ))}
                        </div>
                    </div>
                    <button 
                        onClick={() => saveToRedis("save_settings", settings)}
                        className="w-full py-4 bg-slate-800 text-white rounded-2xl flex items-center justify-center gap-2 font-bold hover:bg-black transition-all"
                    >
                        {updating ? <Loader2 className="animate-spin" /> : <Save size={18} />} Save Global Config
                    </button>
                </div>
            </div>

            {/* Live Status Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-8 rounded-[32px] shadow-xl text-white">
                <p className="text-xs font-bold opacity-70 uppercase tracking-widest">Server Status</p>
                <div className="flex items-center gap-3 mt-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                    <h2 className="text-2xl font-bold">Vercel Edge Live</h2>
                </div>
                <p className="mt-4 text-sm opacity-80 leading-relaxed">
                    Ads are being served from the nearest edge location for maximum performance.
                </p>
            </div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="glass p-8 rounded-[32px] shadow-2xl w-full max-w-lg animate-in">
            <h2 className="text-2xl font-bold mb-6">Create New Ad</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 uppercase ml-1">Ad Title</label>
                <input 
                    type="text" 
                    value={newAd.title} 
                    onChange={e => setNewAd({...newAd, title: e.target.value})}
                    placeholder="E.g. Summer Sale Banner"
                    className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none"
                />
              </div>
              <div className="flex gap-2">
                <button 
                    onClick={() => setNewAd({...newAd, type: "custom"})}
                    className={`flex-1 py-3 rounded-xl border font-bold transition-all ${newAd.type === "custom" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-400 border-slate-200"}`}
                >Custom Image</button>
                <button 
                    onClick={() => setNewAd({...newAd, type: "network"})}
                    className={`flex-1 py-3 rounded-xl border font-bold transition-all ${newAd.type === "network" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-slate-400 border-slate-200"}`}
                >Network Code</button>
              </div>

              {newAd.type === "custom" ? (
                <>
                    <div className="relative group">
                        <input type="file" id="ad_file" className="hidden" onChange={handleImageUpload} />
                        <label htmlFor="ad_file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-white/30 hover:border-indigo-400 transition-all">
                            <ImageIcon className="text-slate-300 group-hover:text-indigo-400" />
                            <span className="text-xs text-slate-400 mt-2">{newAd.imageUrl ? "Image Ready ✓" : "Upload to ImgBB"}</span>
                        </label>
                    </div>
                    <input 
                        type="url" 
                        value={newAd.targetUrl} 
                        onChange={e => setNewAd({...newAd, targetUrl: e.target.value})}
                        placeholder="Target Redirect URL"
                        className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none"
                    />
                </>
              ) : (
                <textarea 
                    value={newAd.code} 
                    onChange={e => setNewAd({...newAd, code: e.target.value})}
                    placeholder="Paste Script/HTML code here..."
                    className="w-full h-32 px-4 py-3 bg-white/50 border border-slate-200 rounded-xl outline-none resize-none font-mono text-sm"
                />
              )}

              <div className="flex gap-2 pt-4">
                <button 
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 py-4 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                >Cancel</button>
                <button 
                    onClick={addAd}
                    className="flex-[2] py-4 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg hover:bg-indigo-700 transition-all"
                >Launch Ad</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
