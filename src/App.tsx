/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { Play, Pause, Headphones, Music2, Share2, Youtube, Instagram, Twitter, ChevronRight, Activity, Zap, Volume2, LayoutGrid, Shield, Plus, X, BookOpen } from "lucide-react";
import React, { useRef, useState, useEffect } from "react";
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';

interface Track {
  title: string;
  artist: string;
  artistId: string;
  bpm: string;
  duration: string;
  img: string;
  code: string;
  url: string;
}

interface Artist {
  id: string;
  name: string;
  role: string;
  bio: string;
  img: string;
  genre: string;
}

const ARTISTS: Artist[] = [
  {
    id: "all",
    name: "All Artists",
    role: "Complete Roster",
    bio: "The full spectrum of GH Records sound.",
    img: "https://images.unsplash.com/photo-1514525253361-b83f859b73c0?auto=format&fit=crop&q=80&w=800",
    genre: "Various"
  },
  {
    id: "gh-collective",
    name: "Goon & Hustler",
    role: "Founding Collective",
    bio: "The architects of the 92 BPM vibration. Their sound is the foundation of the GH Records landscape.",
    img: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=800",
    genre: "Ambient / Industrial"
  },
  {
    id: "naomi-soul",
    name: "Naomi Soul",
    role: "The Voice of Grace",
    bio: "Naomi blends celestial gospel harmonies with the grounded pain of urban romance. Her frequency is one of healing and honesty.",
    img: "https://images.unsplash.com/photo-1531123897727-8f129e16f590?auto=format&fit=crop&q=80&w=800",
    genre: "Gospel / Sad Soul"
  },
  {
    id: "mc-kiberiti",
    name: "MC Kiberiti",
    role: "The Street Lyricist",
    bio: "A matchstick in a dark room. MC Kiberiti's delivery is sharp and focused, narrating the struggle with precision.",
    img: "https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?auto=format&fit=crop&q=80&w=800",
    genre: "Street Rap"
  }
];

const TRACKS: Track[] = [
  { 
    title: "Kasongo Sio Shida", 
    artist: "Goon & Hustler",
    artistId: "gh-collective",
    bpm: "92 BPM", 
    duration: "4:12", 
    img: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80&w=800",
    code: "GH-001",
    url: "/Kasongo Sio Shida (1).mp3"
  },
  { 
    title: "Healing Waters", 
    artist: "Naomi Soul",
    artistId: "naomi-soul",
    bpm: "75 BPM", 
    duration: "5:20", 
    img: "https://images.unsplash.com/photo-1504173010664-32509aebe629?auto=format&fit=crop&q=80&w=800",
    code: "NS-001",
    url: "#"
  },
  { 
    title: "Matchbox Flow", 
    artist: "MC Kiberiti",
    artistId: "mc-kiberiti",
    bpm: "94 BPM", 
    duration: "3:15", 
    img: "https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=800",
    code: "MCK-001",
    url: "#"
  },
  { 
    title: "Safari Ya Singapore", 
    artist: "Goon & Hustler",
    artistId: "gh-collective",
    bpm: "105 BPM", 
    duration: "3:45", 
    img: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?auto=format&fit=crop&q=80&w=800",
    code: "GH-002",
    url: "/Safari Ya Singapore.mp3"
  },
  { 
    title: "Broken Vow", 
    artist: "Naomi Soul",
    artistId: "naomi-soul",
    bpm: "68 BPM", 
    duration: "4:40", 
    img: "https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?auto=format&fit=crop&q=80&w=800",
    code: "NS-002",
    url: "#"
  },
  { 
    title: "Street Vibrations", 
    artist: "Goon & Hustler",
    artistId: "gh-collective",
    bpm: "90 BPM", 
    duration: "3:12", 
    img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=800",
    code: "GH-003",
    url: "/Street Vibrations.mp3"
  },
  { 
    title: "Asphalt Poet", 
    artist: "MC Kiberiti",
    artistId: "mc-kiberiti",
    bpm: "89 BPM", 
    duration: "2:55", 
    img: "https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=800",
    code: "MCK-002",
    url: "#"
  },
  { 
    title: "Concrete Jungle", 
    artist: "Goon & Hustler",
    artistId: "gh-collective",
    bpm: "88 BPM", 
    duration: "4:05", 
    img: "https://images.unsplash.com/photo-1453090927415-5f45085b65c0?auto=format&fit=crop&q=80&w=800",
    code: "GH-004",
    url: "/Concrete Jungle.mp3"
  },
];

interface Post {
  date: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  downloadUrl?: string;
}

const POSTS: Post[] = [
  {
    date: "MAY 08, 2026",
    title: "Street Vibrations: The Frequency of the Pavement",
    category: "RECORDS",
    excerpt: "Capturing the low-frequency pulses of the urban landscape in our latest release.",
    downloadUrl: "/Street Vibrations.mp3",
    content: `
      # The Frequency of Survival

      "Street Vibrations" is an exploration of the subsonic energy that moves through the city. We wanted to capture the literal vibrations—the rumble of the heavy trucks, the hum of the electrical grid, and the rhythmic shaking of the pavement under a thousand feet.

      ## Sonic Architecture
      We recorded the track at 90 BPM, the heartbeat of a steady walk. The bass is designed to be felt as much as heard, pushing air in a way that mimics the physical presence of the jungle.

      ## The Hustle
      This vibration is what keeps us moving. It's the collective energy of everyone pushing toward their goals. When you listen to "Street Vibrations", you're listening to the pulse of the grind.
    `
  },
  {
    date: "MAY 07, 2026",
    title: "Music Production Tips in the Age of AI",
    category: "GUIDE",
    excerpt: "Essential strategies for modern producers. Learn how to leverage artificial intelligence to enhance your creative workflow without losing the human soul of your sound.",
    downloadUrl: "/Music_Production_Tips_in_the_Age_of_AI.docx",
    content: `
      # The New Producer's Toolkit: AI as a Collaborator

      The street sound has always been about taking what's available and making it legendary. In the 80s it was the drum machine; today, it's Artificial Intelligence. But the goal remains the same: capturing the soul of the city.

      ## 1. AI as a Creative Sandbox
      Don't use AI to write your songs. Use it to explore the sounds you can't reach. Generative tools are incredible for creating "ghost textures"—ambient urban sounds that you can chop, filter, and layer under your 92 BPM kicks.

      ## 2. The Human Imperfection
      AI is too perfect. To maintain the GH Records vibe, always introduce "human fail." If an AI-generated melody is too precise, shift the MIDI a few milliseconds off-grid. Real life doesn't happen on a quantization line.

      ## 3. Vocal Treatment
      While voice cloning is popular, we prefer AI for stems. Use spectral separation to pull clean vocals out of field recordings from the street markets. This allows you to mix the high-fidelity grit of the street with studio-grade production.

      The street doesn't want perfection; it wants the truth. Use the machine, but don't let it drive the bus.
    `
  },
  {
    date: "MAY 05, 2026",
    title: "The Street Pulse: Capturing 92 BPM Survival",
    category: "PRODUCTION",
    excerpt: "How we recorded the ambient sounds of morning commute on the street to build the foundation of 'Kasongo Sio Shida'.",
    content: `
      ## Recording the Pulse
      
      We started at 5:00 AM at the bridge near Olympic. The city wasn't awake, but the hustle already was. We used a field recorder to capture the rhythmic thud of walking feet and the distant clanging of metal—the natural metronome of Nairobi.

      Most people hear noise. We heard a 92 BPM foundation. This isn't just music; it's a field recording of life pushing forward.
    `
  },
  {
    date: "APR 28, 2026",
    title: "Goon vs Hustler: The Duality of Urban Sound",
    category: "CULTURE",
    excerpt: "Exploring the aesthetic tension between systemic order and artistic rebellion in Nairobi's underground scene.",
    content: `
      ## The Sound of Duality
      
      The Goon represents the Grid. The Hustler represents the Flow. Our music lives at the intersection where the rigid structure of the system crashes into the fluid energy of survival.

      When you listen to a GH track, you'll notice the percussion is often static and robotic (The System), while the melodies and vocals are erratic and emotional (The Hustle). It is this friction that creates the heat.

      ## Visual Identity
      As seen in our latest character portraits, Goon and Hustler stand together but looking in different directions—one focused on the horizon of the system, the other on the pulse of the street. Their connection is the foundation of GH Records.
    `
  },
  {
    date: "APR 15, 2026",
    title: "Safari ya Singapore",
    category: "RECORDS",
    excerpt: "This song is a protest: not rejecting the idea of 'Safari ya Singapore', but showing how daily struggles make it feel out of reach.",
    downloadUrl: "/Safari_Ya_Singapore_Blog_Post.docx",
    content: `
      # The Protest Behind the Rhythms

      "Safari ya Singapore"—the journey to Singapore. In Nairobi, it's more than a destination; it's a proverb. It represents the ultimate escape, the dream of a frictionless life where everything works and the streets are paved with order.

      ## The Illusion of Distance
      Our track is a protest. We are not protesting the dream; we are protesting the reality that makes the dream feel like a fairytale for a kid on the street. 

      ## The Daily Grind
      The lyrics contrast the sterile, advanced vision of a "Singapore" with the raw, dusty, sweat-soaked reality of the daily commute. When you spend 14 hours a day fighting just to stay in the same place, a journey like that feels like a trip to another planet.

      We made this song to remind the world that the "safari" starts here, in the struggle.
    `
  },
  {
    date: "APR 05, 2026",
    title: "Concrete Jungle: Urban Survival Acoustics",
    category: "RECORDS",
    excerpt: "Exploring the raw, industrial soundscapes that inspired our latest track 'Concrete Jungle'.",
    downloadUrl: "/Concrete Jungle.mp3",
    content: `
      # The Sound of the Stones

      "Concrete Jungle" isn't just about a place; it's about a state of mind. It's the sound of reinforced steel meeting human ambition.

      ## Engineering Grit
      For this track, we moved away from the 92 BPM comfort zone to 88 BPM—a slower, more deliberate pulse that mimics the heavy machinery of the city. We used distorted bass lines to represent the vibration of the subway and sharp, metallic snares for the construction sites.

      ## Survival as Art
      The jungle doesn't give anything for free. You have to carve your space. This song is for those who are building their legacy one brick at a time.
    `
  },
  {
    date: "MAR 25, 2026",
    title: "The Anatomy of a GH Bassline",
    category: "TECH",
    excerpt: "Breaking down the signature low-end that defines the GH Records sound.",
    content: `
      # Sub-Zero: The GH Low End

      The bassline is the foundation of everything we do. Without the thump, the message doesn't travel.

      ## Layering for Impact
      We never use just one bass patch. A typical GH track has a clean sub-layer for the physical feel, a saturated mid-layer for character, and a high-passed field recording of a diesel engine to add urban texture.

      ## Sidechaining the Soul
      The kick and the bass are in a constant dance. We sidechain heavily to ensure that when the kick hits, the bass bows down, creating a pumping sensation that mimics the breath of the city.
    `
  },
  {
    date: "MAR 12, 2026",
    title: "Nairobi Night Sessions: 3 AM at the Vault",
    category: "DIARY",
    excerpt: "A glimpse into the late-night creative process at our headquarters.",
    content: `
      # Midnight at GH

      The best ideas come when the rest of the world is sleeping. At 3 AM, the city's interference drops, and we can finally hear the music clearly.

      ## The Energy
      There's a specific kind of focus that only exists in the early hours. The coffee is cold, the monitors are glowing, and the tracks start to write themselves.

      ## The Breakthroughs
      "Kasongo Sio Shida" was born during one of these sessions. It started as a simple loop that we couldn't stop playing for four hours straight. That's when you know you have something real.
    `
  },
  {
    date: "FEB 28, 2026",
    title: "Sample Culture: Ethics and Aesthetics",
    category: "RECORDS",
    excerpt: "How we navigate the complex world of urban sampling in the modern era.",
    content: `
      # The Art of the Steal

      Sampling is the DNA of the street. It's about taking the past and recontextualizing it for the future.

      ## Respecting the Source
      Knowledge is power. If we sample a veteran artist, it's an act of homage. We make sure the roots are visible even if the tree looks new.

      ## Found Sounds
      We prefer sampling the city itself. A siren, a street vendor's shout, a playground chime—these are the samples that nobody else has. They are the fingerprints of our production.
    `
  }
];

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showFullCatalog, setShowFullCatalog] = useState(false);
  const [showEditorialArchive, setShowEditorialArchive] = useState(false);
  const [showUploadGuide, setShowUploadGuide] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showDemoPopup, setShowDemoPopup] = useState(false);
  const [showPressKitPopup, setShowPressKitPopup] = useState(false);
  const [showCareersPopup, setShowCareersPopup] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  const [selectedArtist, setSelectedArtist] = useState("all");

  const filteredTracks = TRACKS.filter(track => 
    selectedArtist === "all" || track.artistId === selectedArtist
  );

  const currentTrack = filteredTracks[currentTrackIndex] || filteredTracks[0];

  const handleTrackChange = (index: number) => {
    setCurrentTrackIndex(index);
    setIsPlaying(true);
  };
  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    
    try {
      await addDoc(collection(db, 'subscribers'), {
        email,
        createdAt: serverTimestamp()
      });
      setIsSubscribed(true);
      form.reset();
      setTimeout(() => setIsSubscribed(false), 5000);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'subscribers');
    }
  };

  const nextTrack = React.useCallback(() => {
    setCurrentTrackIndex((prev) => (prev + 1) % TRACKS.length);
  }, []);

  const prevTrack = React.useCallback(() => {
    setCurrentTrackIndex((prev) => (prev - 1 + TRACKS.length) % TRACKS.length);
  }, []);

  const togglePlay = React.useCallback(() => {
    setError(null);
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(err => {
          console.log("Audio play blocked or file missing:", err);
          setError("Missing file: " + currentTrack.url);
          setShowUploadGuide(true);
        });
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, currentTrack.url]);

  const playTrack = (index: number) => {
    if (currentTrackIndex === index) {
      togglePlay();
    } else {
      setCurrentTrackIndex(index);
      setIsPlaying(true);
    }
  };

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }

    const audio = audioRef.current;
    audio.volume = volume;
    audio.muted = isMuted;

    const updateProgress = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setError(null);
    };

    const handleError = () => {
      setError("Track file missing. Please upload your MP3 to the 'public' folder.");
      setIsPlaying(false);
    };

    const handleEnded = () => {
      nextTrack();
    };

    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', updateProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [nextTrack, volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.src = currentTrack.url;
      if (isPlaying) {
        audioRef.current.play().catch(err => {
          console.log("Audio play blocked or file missing:", err);
          setError("File not found at: " + currentTrack.url);
        });
      }
    }
  }, [currentTrack.url, isPlaying]);

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const { scrollYProgress } = useScroll();
  const heroOpacity = useTransform(scrollYProgress, [0, 0.4], [1, 0]);
  const heroScale = useTransform(scrollYProgress, [0, 0.4], [1, 1.1]);

  return (
    <div ref={containerRef} className="min-h-screen font-sans selection:bg-sunset-warm selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 transition-colors duration-300 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center justify-center bg-sunset-warm w-8 h-8 rounded-sm">
            <Music2 className="text-white w-5 h-5" />
          </div>
          <span className="font-display font-bold text-xl tracking-tighter uppercase">GH RECORDS</span>
        </div>
        <div className="hidden md:flex items-center gap-8">
          {["Artists", "Music", "About", "Stories"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-xs uppercase tracking-widest font-medium hover:text-sunset-warm transition-colors">
              {item}
            </a>
          ))}
          <a href="#music" className="px-5 py-2 bg-white text-black text-xs font-bold uppercase tracking-tight hover:bg-sunset-warm hover:text-white transition-all rounded-full">
            Listen Now
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen overflow-hidden flex items-center justify-center">
        <motion.div style={{ opacity: heroOpacity, scale: heroScale }} className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-urban-black via-transparent to-black/40 z-10" />
          <img
            src="https://images.unsplash.com/photo-1542401886-65d6c60db275?auto=format&fit=crop&q=80&w=2000" 
            alt="Cinematic Urban Scene"
            className="w-full h-full object-cover grayscale-[0.2] sepia-[0.2]"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto pt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <span className="inline-block px-3 py-1 bg-sunset-warm/20 text-sunset-warm border border-sunset-warm/30 text-[10px] uppercase tracking-[0.3em] font-bold rounded-full mb-6">
              NAIROBI STREET REALISM
            </span>
            <h1 className="font-display font-bold text-6xl md:text-9xl leading-[0.85] tracking-tighter uppercase mb-6 drop-shadow-2xl">
              GOON <span className="text-sunset-warm">&</span> <br /> HUSTLER
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto font-light leading-relaxed mb-10">
              The tension of the city, captured. Where the authority of the system meets the resilience of the hustle.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <a href="#music" className="w-full md:w-auto px-8 py-4 bg-white text-black font-bold uppercase tracking-wider flex items-center justify-center gap-3 hover:bg-sunset-warm hover:text-white transition-all group">
                <Play className="fill-current w-5 h-5 group-hover:scale-110 transition-transform" />
                Latest Release
              </a>
              <a href="#artists" className="w-full md:w-auto px-8 py-4 border border-white/20 hover:border-white transition-all uppercase tracking-wider text-sm font-bold backdrop-blur-md flex items-center justify-center">
                Meet the Team
              </a>
            </div>
          </motion.div>
        </div>

        {/* Ambient dust effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-20 opacity-30">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              initial={{ x: Math.random() * 100 + "%", y: "100%", opacity: 0 }}
              animate={{
                y: "-10%",
                opacity: [0, 1, 0],
                x: (Math.random() >= 0.5 ? "+" : "-") + "=" + Math.random() * 20 + "px"
              }}
              transition={{
                duration: 5 + Math.random() * 10,
                repeat: Infinity,
                delay: Math.random() * 5,
                ease: "linear"
              }}
            />
          ))}
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-32 px-6 md:px-20 bg-black text-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_20%_30%,rgba(242,125,38,0.05),transparent_70%)]" />
        <div className="max-w-4xl mx-auto relative z-10 space-y-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-sunset-warm" />
              <span className="uppercase tracking-[0.4em] text-[10px] font-bold text-sunset-warm">OUR MANIFESTO</span>
            </div>
            <h2 className="font-display text-5xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.85]">
              SONIC <br /> URBANISM
            </h2>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-12 md:gap-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="space-y-6"
            >
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white italic">"The city is a drum."</h3>
              <p className="text-gray-400 leading-relaxed text-lg font-light">
                GH Records was established in 2026 as a vehicle for documenting the acoustic truth of Nairobi. We operate at the intersection of systematic order (Goon) and artistic resilience (Hustler).
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              <p className="text-gray-500 leading-relaxed text-lg font-light">
                Our approach integrates field recordings from the street, AI-augmented synthesis, and high-fidelity production to create what we call '92 BPM Survival'—music that sounds like the morning commute and feels like the sunset over a concrete jungle.
              </p>
              <div className="pt-4">
                <a href="#stories" className="text-[10px] font-bold tracking-widest uppercase border-b-2 border-sunset-warm pb-1 hover:text-sunset-warm transition-colors">
                  Explore the Blog
                </a>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Characters Section */}
      <section id="artists" className="py-24 px-6 md:px-20 bg-urban-black">
        <div className="grid md:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-sunset-warm" />
              <span className="uppercase tracking-[0.4em] text-xs font-bold text-sunset-warm">THE PERSPECTIVE</span>
            </div>
            <h2 className="font-display text-5xl font-bold uppercase leading-tight">GOON: THE GRID</h2>
            <p className="text-gray-400 leading-relaxed text-lg italic">
              "The system isn't an obstacle. It is the architecture of survival."
            </p>
            <p className="text-gray-500 leading-relaxed">
              Goon is the Enforcer. He represents the unyielding Grid—the static, robotic pulse that provides the structural foundation for every GH release. Dressed in tactical urban gear, his presence is a disciplined block of space in a chaotic world. He doesn't seek to change the city; he seeks to define the boundaries within which it exists.
            </p>
            <ul className="space-y-4">
              {[
                { icon: <LayoutGrid className="w-4 h-4" />, text: "Architect of the Sonic Grid" },
                { icon: <Activity className="w-4 h-4" />, text: "Static Robotic Percussion" },
                { icon: <Shield className="w-4 h-4" />, text: "Unyielding System Authority" },
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-gray-300 font-mono">
                  {item.icon} {item.text}
                </li>
              ))}
            </ul>
          </motion.div>
          <div className="relative aspect-[4/5] bg-neutral-900 group overflow-hidden">
             <img
              src="https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=800"
              alt="Goon Silhouette"
              className="w-full h-full object-cover opacity-60 grayscale group-hover:opacity-80 group-hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 border border-white/10 m-4" />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-20 items-center mt-32">
          <div className="relative aspect-[4/5] bg-neutral-900 md:order-1 order-2 group overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1520166012956-add9ba0835cb?auto=format&fit=crop&q=80&w=800"
              alt="Hustler Silhouette"
              className="w-full h-full object-cover opacity-60 grayscale group-hover:opacity-80 group-hover:grayscale-0 transition-all duration-700"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 border border-white/10 m-4" />
          </div>
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8 md:order-2 order-1"
          >
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-sunset-warm" />
              <span className="uppercase tracking-[0.4em] text-xs font-bold text-sunset-warm">THE DRIVE</span>
            </div>
            <h2 className="font-display text-5xl font-bold uppercase leading-tight">HUSTLER: THE RESILIENCE</h2>
            <p className="text-gray-400 leading-relaxed text-lg italic">
              "They build walls to keep us down, but music is the only thing that can climb over."
            </p>
            <p className="text-gray-500 leading-relaxed">
              Determined and worn-down, Hustler is the spirit of survival pushing against an invisible pressure. In faded streetwear and worn sneakers, his expression is a mix of frustration and relentless hope—the sound of a heart refusing to be silenced by the system.
            </p>
             <ul className="space-y-4">
              {[
                { icon: <Headphones className="w-4 h-4" />, text: "Vocalist of the Unheard" },
                { icon: <Zap className="w-4 h-4" />, text: "Raw Aspiration & Sonic Resistance" },
              ].map((item, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm text-gray-300 font-mono">
                  {item.icon} {item.text}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </section>

      {/* Recent Drops (Condensed Catalog) */}
      <section id="music" className="py-32 bg-white text-black relative overflow-hidden">
        <div className="px-6 md:px-20 mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-px bg-sunset-warm" />
              <span className="text-xs font-bold tracking-[0.4em] text-gray-500 uppercase">Latest Drops</span>
            </div>
            <h2 className="font-display text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.85] mb-6">
              THE STREET <br /> <span className="text-gray-300 italic">CATALOG</span>
            </h2>
            <p className="text-gray-600 text-lg font-light leading-relaxed">
              Our most recent frequencies carved from the pavement. Explore the sonic architecture of Nairobi.
            </p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setSelectedArtist("all");
              setShowFullCatalog(true);
            }}
            className="group flex items-center gap-4 bg-black text-white px-10 py-6 text-[10px] font-bold tracking-[0.3em] uppercase rounded-sm hover:bg-sunset-warm transition-all duration-500"
          >
            ENTER THE VAULT <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.button>
        </div>

        {/* Featured Slider Area */}
        <div className="flex overflow-x-auto pb-12 px-6 md:px-20 no-scrollbar gap-8 snap-x snap-mandatory">
          {TRACKS.slice(0, 4).map((track, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => playTrack(idx)}
              className="flex-shrink-0 w-full md:w-[600px] snap-center aspect-video md:aspect-[16/10] relative group cursor-pointer overflow-hidden border border-black/5"
            >
              <img
                src={track.img}
                alt={track.title}
                className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-1000 ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
              
              <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white w-full">
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-[1px] bg-sunset-warm" />
                  <p className="text-[10px] font-mono tracking-[0.4em] text-sunset-warm uppercase">{track.code}</p>
                </div>
                <h3 className="font-display text-4xl md:text-5xl font-bold uppercase leading-tight mb-4 tracking-tighter">
                  {track.title}
                </h3>
                <div className="flex flex-wrap items-center gap-6">
                  <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">{track.artist}</p>
                  <div className="h-4 w-px bg-white/20" />
                  <div className="flex items-center gap-3 text-[10px] font-bold tracking-[0.2em] text-sunset-warm">
                    <Activity className="w-3 h-3" /> {track.bpm}
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-75 group-hover:scale-100">
                <div className="w-24 h-24 bg-sunset-warm rounded-full flex items-center justify-center shadow-[0_0_60px_rgba(242,125,38,0.4)]">
                  {isPlaying && currentTrackIndex === idx ? (
                    <Pause className="fill-white text-white w-10 h-10" />
                  ) : (
                    <Play className="fill-white text-white w-10 h-10 ml-1" />
                  )}
                </div>
              </div>

              {/* Tape Deck Corner Detail */}
              <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-sunset-warm animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
          
          {/* View All Card at end of scroll */}
          <motion.div 
            onClick={() => {
              setSelectedArtist("all");
              setShowFullCatalog(true);
            }}
            className="flex-shrink-0 w-full md:w-[400px] snap-center aspect-video md:aspect-[16/10] bg-black group cursor-pointer flex flex-col items-center justify-center border border-white/10"
          >
            <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center mb-6 group-hover:border-sunset-warm group-hover:bg-sunset-warm transition-all duration-500">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] font-bold tracking-[0.4em] text-white uppercase">Browse the Full Vault</span>
            <p className="text-gray-500 text-xs mt-2 uppercase tracking-widest">{TRACKS.length} Total Tracks</p>
          </motion.div>
        </div>
      </section>

      {/* Artist Roster Section */}
      <section id="artists" className="px-6 md:px-20 py-32 bg-urban-black relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        
        <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-px bg-sunset-warm" />
              <span className="text-xs font-bold tracking-[0.4em] text-sunset-warm uppercase">The Roster</span>
            </div>
            <h2 className="font-display text-5xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-6">
              Artist <span className="text-gray-500">Personas</span>
            </h2>
            <p className="text-gray-400 text-lg font-light leading-relaxed">
              GH Records manages a diverse spectrum of urban frequencies—from celestial soul to the grit of the pavement.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
          {ARTISTS.filter(a => a.id !== "all").map((artist, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              onClick={() => {
                setSelectedArtist(artist.id);
                setCurrentTrackIndex(0);
                setShowFullCatalog(true);
              }}
              className="group relative cursor-pointer"
            >
              <div className="aspect-[3/4] overflow-hidden mb-8 border border-white/10 group-hover:border-sunset-warm transition-all duration-500">
                <img 
                  src={artist.img} 
                  alt={artist.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-1000"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60" />
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold text-sunset-warm tracking-[0.3em] uppercase mb-1">{artist.genre}</p>
                  <h3 className="font-display text-3xl font-bold uppercase tracking-tight group-hover:text-white transition-colors">
                    {artist.name}
                  </h3>
                  <p className="text-xs text-gray-500 uppercase tracking-widest mt-1 font-bold">{artist.role}</p>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed font-light">
                  {artist.bio}
                </p>
                <div className="flex gap-4 pt-4">
                  <span className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-sunset-warm group-hover:text-white transition-colors">
                    VIEW DISCOGRAPHY <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stories (Blog) Section */}
      <section id="stories" className="py-32 px-6 md:px-20 bg-black text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-sunset-warm/5 blur-[120px] rounded-full -translate-y-1/2" />
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-12 mb-20 relative z-10">
          <div className="max-w-2xl">
            <div className="flex items-center gap-4 mb-6">
              <span className="h-px w-12 bg-sunset-warm" />
              <span className="uppercase tracking-[0.4em] text-[10px] font-bold text-sunset-warm">THE HUSTLE CHRONICLES</span>
            </div>
            <h2 className="font-display text-6xl md:text-8xl font-bold uppercase tracking-tighter leading-[0.85]">STORIES FROM <br /> THE STREET</h2>
          </div>
          <p className="text-gray-500 max-w-sm text-sm font-medium tracking-tight leading-relaxed">
            Unfiltered perspectives from the concrete jungle. Insights into the production, the culture, and the spirit behind every GH release.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
          {POSTS.slice(0, 6).map((post, idx) => (
            <motion.div 
              key={idx}
              whileHover={{ y: -10 }}
              onClick={() => setSelectedPost(post)}
              className="group cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="bg-sunset-warm/20 text-sunset-warm text-[8px] font-bold px-2 py-1 tracking-widest uppercase rounded-sm">
                  {post.category}
                </span>
                <div className="w-1 h-1 bg-white/20 rounded-full" />
                <p className="text-[10px] font-mono text-gray-500 font-bold tracking-[0.2em]">{post.date}</p>
              </div>
              <h3 className="font-display text-2xl font-bold uppercase tracking-tight mb-4 group-hover:text-sunset-warm transition-colors leading-tight">
                {post.title}
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed mb-6 line-clamp-3">
                {post.excerpt}
              </p>
              <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase hover:text-sunset-warm transition-colors">
                READ ARTICLE <ChevronRight className="w-3 h-3 text-sunset-warm" />
              </div>
            </motion.div>
          ))}
        </div>

        {POSTS.length > 6 && (
          <div className="mt-20 flex justify-center relative z-10">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowEditorialArchive(true)}
              className="group flex items-center gap-4 bg-white/5 border border-white/10 text-white px-10 py-6 text-[10px] font-bold tracking-[0.3em] uppercase rounded-sm hover:bg-white hover:text-black transition-all duration-500"
            >
              ENTER THE ARCHIVE <BookOpen className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            </motion.button>
          </div>
        )}
      </section>

      <AnimatePresence>
        {/* Article Reader Modal */}
        {selectedPost && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
          >
            <div 
              className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
              onClick={() => setSelectedPost(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="relative w-full max-w-4xl max-h-full overflow-y-auto bg-urban-black border border-white/10 rounded-sm shadow-2xl scrollbar-hide"
            >
              <div className="sticky top-0 left-0 right-0 p-6 flex justify-between items-center bg-urban-black/80 backdrop-blur-md z-20 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-sunset-warm rounded-full" />
                  <span className="text-[10px] font-bold tracking-widest uppercase text-gray-400">{selectedPost.category} / {selectedPost.date}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setSelectedPost(null)}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 md:p-16">
                <h2 className="font-display text-4xl md:text-7xl font-bold uppercase tracking-tighter leading-none mb-10 text-white">
                  {selectedPost.title}
                </h2>

                <div className="flex items-center gap-6 mb-12 py-6 border-y border-white/5">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Category</span>
                    <span className="text-xs font-bold text-sunset-warm uppercase tracking-widest">{selectedPost.category}</span>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Date Published</span>
                    <span className="text-xs font-bold text-white uppercase tracking-widest">{selectedPost.date}</span>
                  </div>
                </div>

                <div className="prose prose-invert prose-orange max-w-none">
                  <div className="space-y-6 text-gray-300 leading-relaxed font-light text-lg whitespace-pre-line">
                    {selectedPost.content}
                  </div>
                </div>

                <div className="mt-20 pt-12 border-t border-white/10">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">SHARED BY</p>
                  <p className="font-display text-xl font-bold uppercase">GH RECORDS EDITORIAL</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Full Catalog Modal */}
        {showFullCatalog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
          >
            <div 
              className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
              onClick={() => setShowFullCatalog(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="relative w-full max-w-5xl max-h-full overflow-y-auto bg-urban-black border border-white/10 rounded-sm shadow-2xl scrollbar-hide"
            >
              <div className="sticky top-0 left-0 right-0 p-6 flex justify-between items-center bg-urban-black/80 backdrop-blur-md z-20 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <Music2 className="text-sunset-warm w-5 h-5" />
                  <span className="text-xs font-bold tracking-[0.4em] uppercase text-white">
                    {selectedArtist === "all" ? "Full Catalog" : `${ARTISTS.find(a => a.id === selectedArtist)?.name} Discography`}
                  </span>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowFullCatalog(false)}
                  className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-8 md:p-12">
                {/* Artist Filter Buttons */}
                <div className="flex flex-wrap gap-3 mb-10 pb-8 border-b border-white/5">
                  {ARTISTS.map((artist) => (
                    <button
                      key={artist.id}
                      type="button"
                      onClick={() => {
                        setSelectedArtist(artist.id);
                        setCurrentTrackIndex(0);
                      }}
                      className={`px-6 py-3 text-[10px] font-bold uppercase tracking-widest rounded-sm transition-all border ${
                        selectedArtist === artist.id 
                          ? 'bg-white text-black border-white' 
                          : 'bg-transparent text-gray-400 border-white/10 hover:border-white/40'
                      }`}
                    >
                      {artist.name}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredTracks.map((track, idx) => (
                    <motion.div 
                      key={idx}
                      onClick={() => {
                        handleTrackChange(idx);
                        setShowFullCatalog(false);
                      }}
                      className="group bg-white/5 border border-white/10 p-6 flex items-center gap-6 hover:bg-white/10 transition-all cursor-pointer rounded-sm"
                    >
                      <div className="w-20 h-20 overflow-hidden flex-shrink-0 border border-white/10">
              <img 
                src={track.img} 
                alt={track.title} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" 
              />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] font-mono text-sunset-warm tracking-widest mb-1">{track.code}</p>
                        <h3 className="font-display text-2xl font-bold uppercase tracking-tight text-white">{track.title}</h3>
                        <p className="text-xs text-gray-500 uppercase tracking-widest">{track.artist}</p>
                      </div>
                      <div className="hidden md:flex flex-col items-end gap-1">
                        <span className="text-[10px] font-mono text-gray-400">{track.bpm}</span>
                        <span className="text-[10px] font-mono text-gray-400">{track.duration}</span>
                      </div>
                      <div className="w-12 h-12 rounded-full border border-white/20 flex items-center justify-center group-hover:bg-white group-hover:text-black transition-all">
                        <Play className="w-4 h-4" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {/* Editorial Archive Modal */}
        {showEditorialArchive && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10"
          >
            <div 
              className="absolute inset-0 bg-black/95 backdrop-blur-xl" 
              onClick={() => setShowEditorialArchive(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, y: 50, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 50, opacity: 0 }}
              className="relative w-full max-w-5xl max-h-full overflow-y-auto bg-urban-black border border-white/10 rounded-sm shadow-2xl scrollbar-hide"
            >
              <div className="sticky top-0 left-0 right-0 p-6 flex justify-between items-center bg-urban-black/80 backdrop-blur-md z-20 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <BookOpen className="text-sunset-warm w-5 h-5" />
                  <span className="text-xs font-bold tracking-[0.4em] uppercase text-white">EDITORIAL ARCHIVE</span>
                </div>
                <button 
                type="button"
                onClick={() => setShowEditorialArchive(false)}
                className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all"
              >
                <X className="w-4 h-4" />
              </button>
              </div>

              <div className="p-8 md:p-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {POSTS.map((post, idx) => (
                    <motion.div 
                      key={idx}
                      whileHover={{ y: -5 }}
                      onClick={() => {
                        setSelectedPost(post);
                        setShowEditorialArchive(false);
                      }}
                      className="group bg-white/5 border border-white/10 p-8 flex flex-col hover:bg-white/10 transition-all cursor-pointer rounded-sm"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="bg-sunset-warm/20 text-sunset-warm text-[8px] font-bold px-2 py-1 tracking-widest uppercase rounded-sm">
                          {post.category}
                        </span>
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <p className="text-[10px] font-mono text-gray-500 font-bold tracking-[0.2em]">{post.date}</p>
                      </div>
                      <h3 className="font-display text-xl font-bold uppercase tracking-tight mb-4 group-hover:text-sunset-warm transition-colors">
                        {post.title}
                      </h3>
                      <p className="text-gray-500 text-xs leading-relaxed mb-6 line-clamp-3">
                        {post.excerpt}
                      </p>
                      <div className="mt-auto flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase text-sunset-warm">
                        READ ARTICLE <ChevronRight className="w-3 h-3" />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Footer */}
      <footer className="bg-urban-black pt-24 pb-32 px-6 md:px-20 border-t border-white/5">
        <div className="grid md:grid-cols-12 gap-12 mb-24">
          <div className="md:col-span-5 space-y-8">
            <h2 className="font-display text-5xl font-bold uppercase tracking-tight">JOIN THE <br /> <span className="text-sunset-warm">HUSTLE</span></h2>
            {isSubscribed ? (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-sunset-warm/10 border border-sunset-warm/30 p-6 space-y-2"
              >
                <p className="text-sunset-warm font-bold text-xs tracking-widest uppercase">WELCOME TO THE GRID</p>
                <p className="text-gray-400 text-sm">Your frequency has been registered. Expect a transmission soon.</p>
              </motion.div>
            ) : (
              <>
                <p className="text-gray-400 max-w-sm leading-relaxed">
                  Subscribe to get the latest urban drops, exclusive street stories, and music production tips.
                </p>
                <form onSubmit={handleSubscribe} className="flex gap-2 max-w-md">
                  <input
                    type="email"
                    required
                    placeholder="EMAIL ADDRESS"
                    className="flex-1 bg-white/5 border border-white/10 px-6 py-4 text-xs font-bold tracking-widest focus:outline-none focus:border-sunset-warm transition-colors"
                  />
                  <button type="submit" className="bg-white text-black px-8 py-4 font-bold text-xs tracking-widest uppercase hover:bg-sunset-warm hover:text-white transition-all">
                    SUBMIT
                  </button>
                </form>
              </>
            )}
          </div>

          <div className="md:col-span-2 space-y-6">
            <h3 className="text-[10px] font-bold tracking-[0.4em] text-gray-500 uppercase">LABEL</h3>
            <ul className="space-y-4 text-xs font-bold tracking-widest uppercase">
              <li><a href="#artists" className="hover:text-sunset-warm transition-colors">Artists</a></li>
              <li><a href="#music" className="hover:text-sunset-warm transition-colors">Releases</a></li>
              <li><button onClick={() => setShowDemoPopup(true)} className="text-xs font-bold tracking-widest uppercase hover:text-sunset-warm transition-colors cursor-pointer text-left">Submit Demo</button></li>
            </ul>
          </div>

          <div className="md:col-span-2 space-y-6">
            <h3 className="text-[10px] font-bold tracking-[0.4em] text-gray-500 uppercase">COMPANY</h3>
            <ul className="space-y-4 text-xs font-bold tracking-widest uppercase">
              <li><a href="#about" className="hover:text-sunset-warm transition-colors">About Us</a></li>
              <li><button onClick={() => setShowCareersPopup(true)} className="text-xs font-bold tracking-widest uppercase hover:text-sunset-warm transition-colors cursor-pointer text-left">Careers</button></li>
              <li><button onClick={() => setShowPressKitPopup(true)} className="text-xs font-bold tracking-widest uppercase hover:text-sunset-warm transition-colors cursor-pointer text-left">Contact Us</button></li>
            </ul>
          </div>

          <div className="md:col-span-3 space-y-6">
            <h3 className="text-[10px] font-bold tracking-[0.4em] text-gray-500 uppercase">CONNECT</h3>
            <div className="flex gap-4">
              {[Youtube, Instagram, Twitter, Share2].map((Icon, idx) => (
                <a key={idx} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-all">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <p className="text-[10px] font-mono text-gray-500 mt-8">
              EST 2026. NAIROBI, KENYA.<br />
              ALL RIGHTS RESERVED.
            </p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-between items-center pt-12 border-t border-white/5 gap-6">
          <div className="flex items-center gap-2 grayscale brightness-50">
           <Music2 className="w-4 h-4 text-white" />
           <span className="font-display font-bold text-sm tracking-tighter uppercase">GH RECORDS</span>
          </div>
          <div className="flex gap-8 text-[10px] font-bold tracking-widest text-gray-500 uppercase">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

      {/* Now Playing Bar */}
      <motion.div 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className="fixed bottom-0 left-0 right-0 bg-urban-black/95 border-t border-white/10 backdrop-blur-xl px-6 py-4 z-[100] flex items-center justify-between"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-neutral-800 rounded-sm overflow-hidden relative group">
            <img 
              src={currentTrack.img} 
              alt="Track Art" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover" 
            />
            {error && (
              <div className="absolute inset-0 bg-red-600/80 flex items-center justify-center p-1">
                <span className="text-[10px] font-bold text-white text-center leading-tight">MISSING FILE</span>
              </div>
            )}
          </div>
          <div>
            <h4 className="text-white text-sm font-bold uppercase tracking-tight line-clamp-1">{currentTrack.title}</h4>
            <div className="flex items-center gap-2">
              <p className="text-sunset-warm text-[10px] font-bold tracking-widest uppercase">{currentTrack.artist}</p>
              {isPlaying && !error && (
                <div className="flex gap-[1px]">
                  {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="w-[2px] bg-sunset-warm"
                        animate={{ height: ["2px", "8px", "4px"] }}
                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                      />
                    ))}
                </div>
              )}
            </div>
            {error && <p className="text-[8px] text-red-400 font-mono tracking-tighter mt-1">{error}</p>}
          </div>
        </div>

        {/* Upload Guide Overlay */}
        {showUploadGuide && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute bottom-28 left-6 right-6 bg-white text-black p-6 shadow-2xl z-[110] border-l-4 border-sunset-warm md:max-w-sm rounded"
          >
            <div className="flex justify-between items-start mb-4">
              <h5 className="font-display font-bold text-lg uppercase tracking-tight">Sync Your Record</h5>
              <button onClick={() => setShowUploadGuide(false)} className="text-gray-400 hover:text-black">
                <Youtube className="w-4 h-4 rotate-45" />
              </button>
            </div>
            <p className="text-[11px] text-gray-600 mb-4 leading-relaxed">
              To play your real tracks, upload the MP3 files to the <span className="font-bold text-black">public/</span> directory in the sidebar.
            </p>
            <div className="bg-gray-100 p-3 rounded mb-6 flex items-center gap-3">
              <Music2 className="w-4 h-4 text-sunset-warm" />
              <div className="flex flex-col">
                <code className="text-[10px] font-bold">Kasongo_Sio_Shida.mp3</code>
                <code className="text-[10px] font-bold">Safari_ya_Singapore.mp3</code>
              </div>
            </div>
            <button 
              onClick={() => setShowUploadGuide(false)}
              className="w-full bg-black text-white text-[10px] font-bold py-3 uppercase tracking-widest hover:bg-sunset-warm transition-colors rounded-sm"
            >
              GOT IT
            </button>
          </motion.div>
        )}

        <div className="hidden md:flex flex-col items-center gap-2 flex-1 max-w-xl mx-8">
          <div className="flex items-center gap-6 text-white">
            <button onClick={prevTrack} className="opacity-60 hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5 rotate-180" /></button>
            <button 
              onClick={togglePlay}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${error ? 'bg-neutral-800 text-gray-500 cursor-not-allowed' : 'bg-white text-black hover:bg-sunset-warm hover:text-white'}`}
              disabled={!!error}
            >
              {isPlaying ? (
                <Pause className="fill-current w-4 h-4" />
              ) : (
                <Play className="fill-current w-4 h-4 ml-1" />
              )}
            </button>
            <button onClick={nextTrack} className="opacity-60 hover:opacity-100 transition-opacity"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="w-full bg-white/10 h-1 rounded-full overflow-hidden relative group cursor-pointer">
            <motion.div 
              className={`absolute top-0 left-0 h-full ${error ? 'bg-red-500' : 'bg-sunset-warm'}`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between w-full text-[8px] font-mono text-gray-500 uppercase tracking-widest">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <div className="hidden md:flex items-center gap-3">
             <button 
               onClick={() => setIsMuted(!isMuted)}
               className="text-white opacity-40 hover:opacity-100 transition-opacity outline-none"
             >
               {isMuted || volume === 0 ? <Volume2 className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
             </button>
             <div className="w-24 bg-white/10 h-1 rounded-full relative group cursor-pointer">
                <input 
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => {
                    setVolume(parseFloat(e.target.value));
                    setIsMuted(false);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div 
                  className="absolute top-0 left-0 h-full bg-white/40 group-hover:bg-sunset-warm transition-colors"
                  style={{ width: `${(isMuted ? 0 : volume) * 100}%` }}
                />
             </div>
           </div>
           <button className="p-2 border border-white/10 rounded-full hover:bg-white hover:text-black transition-all">
             <Share2 className="w-4 h-4" />
           </button>
        </div>
      </motion.div>
      {/* Demo Submission Popup */}
      {showDemoPopup && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowDemoPopup(false)}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative bg-urban-black border border-white/10 p-8 md:p-12 max-w-xl w-full space-y-8"
          >
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-sunset-warm" />
              <span className="uppercase tracking-[0.4em] text-[10px] font-bold text-sunset-warm">DEMO SUBMISSIONS</span>
            </div>
            
            <div className="space-y-4">
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none text-white">
                CURRENTLY <br /> CLOSED
              </h2>
              <p className="text-gray-400 font-light text-lg leading-relaxed">
                We're currently focusing on our upcoming 2026 roster and are not accepting any new demos at the moment. 
                <span className="block mt-4 text-sunset-warm font-bold italic tracking-tight">
                  Check back in a few months.
                </span>
              </p>
            </div>

            <button 
              onClick={() => setShowDemoPopup(false)}
              className="w-full bg-white text-black py-4 font-bold text-xs tracking-widest uppercase hover:bg-sunset-warm hover:text-white transition-all transform hover:-translate-y-1 active:translate-y-0"
            >
              UNDERSTOOD
            </button>
          </motion.div>
        </motion.div>
      )}
      {/* Contact Us Popup */}
      {showPressKitPopup && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowPressKitPopup(false)}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative bg-urban-black border border-white/10 p-8 md:p-12 max-w-xl w-full space-y-8"
          >
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-sunset-warm" />
              <span className="uppercase tracking-[0.4em] text-[10px] font-bold text-sunset-warm">GET IN TOUCH</span>
            </div>
            
            <div className="space-y-4">
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none text-white">
                CONTACT <br /> THE LABEL
              </h2>
              <p className="text-gray-400 font-light text-lg leading-relaxed">
                Whether you're looking for a collaboration, have a technical issue, or just want to say hi, our doors are open.
                <span className="block mt-4 text-sunset-warm font-bold italic tracking-tight">
                  Reach us at: info@ghrecords.io
                </span>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
                <h4 className="text-[10px] font-bold tracking-widest text-white uppercase mb-2">GENERAL</h4>
                <p className="text-gray-500 text-[10px]">Inquiries & Partnerships</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/10 rounded-sm">
                <h4 className="text-[10px] font-bold tracking-widest text-white uppercase mb-2">BOOKING</h4>
                <p className="text-gray-500 text-[10px]">Artist events & Interviews</p>
              </div>
            </div>

            <button 
              onClick={() => setShowPressKitPopup(false)}
              className="w-full bg-white text-black py-4 font-bold text-xs tracking-widest uppercase hover:bg-sunset-warm hover:text-white transition-all transform hover:-translate-y-1 active:translate-y-0"
            >
              BACK TO SITE
            </button>
          </motion.div>
        </motion.div>
      )}
      {/* Careers Popup */}
      {showCareersPopup && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-6"
        >
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowCareersPopup(false)}
            className="absolute inset-0 bg-black/90 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="relative bg-urban-black border border-white/10 p-8 md:p-12 max-w-xl w-full space-y-8"
          >
            <div className="flex items-center gap-4">
              <span className="h-px w-12 bg-sunset-warm" />
              <span className="uppercase tracking-[0.4em] text-[10px] font-bold text-sunset-warm">WORK WITH US</span>
            </div>
            
            <div className="space-y-4">
              <h2 className="font-display text-4xl md:text-5xl font-bold uppercase tracking-tighter leading-none text-white">
                NO OPEN <br /> POSITIONS
              </h2>
              <p className="text-gray-400 font-light text-lg leading-relaxed">
                We're not currently hiring for any new roles at GH Records. However, we're always looking for exceptional talent to join our network.
                <span className="block mt-4 text-sunset-warm font-bold italic tracking-tight">
                  Check back in the coming months for new opportunities.
                </span>
              </p>
            </div>

            <button 
              onClick={() => setShowCareersPopup(false)}
              className="w-full bg-white text-black py-4 font-bold text-xs tracking-widest uppercase hover:bg-sunset-warm hover:text-white transition-all transform hover:-translate-y-1 active:translate-y-0"
            >
              CLOSE
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

