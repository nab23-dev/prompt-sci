import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc, updateDoc, orderBy, limit, startAfter, getDocs, Timestamp, DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import MotionPage from '../components/MotionPage';
import { Copy, ThumbsUp, Heart, Smile, Angry, Wow, Link2 } from 'lucide-react';

// Assuming types.ts exists
interface Post {
    id: string;
    uid: string;
    caption?: string;
    prompt: string;
    imageURL?: string;
    timestamp: Timestamp;
    reactions: { [userId: string]: string };
    name: string;
    color: string;
}

interface UserCache {
    [uid: string]: string;
}

const reactionIcons: { [key: string]: React.ReactElement } = {
    like: <ThumbsUp size={16} />,
    love: <Heart size={16} />,
    haha: <Smile size={16} />,
    angry: <Angry size={16} />,
    wow: <Wow size={16} />,
};

// This component is defined outside FeedPage to avoid re-creation on re-renders
const PostCard: React.FC<{ post: Post; onReact: (postId: string, type: string) => void; currentUserId: string | undefined; }> = React.memo(({ post, onReact, currentUserId }) => {
    const [copied, setCopied] = useState(false);
    const [linkCopied, setLinkCopied] = useState(false);

    const handleCopy = (text: string, type: 'prompt' | 'link') => {
        navigator.clipboard.writeText(text);
        if (type === 'prompt') {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } else {
            setLinkCopied(true);
            setTimeout(() => setLinkCopied(false), 2000);
        }
    };

    const timeAgo = (ts: Timestamp) => {
        const d = ts.toDate();
        const sec = (Date.now() - d.getTime()) / 1000;
        if (sec < 60) return `${Math.floor(sec)}s ago`;
        if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
        if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
        return `${Math.floor(sec / 86400)}d ago`;
    };

    // Fix: Explicitly type 'reaction' as a string.
    // TypeScript may infer `reaction` as `unknown` from `Object.values`, which cannot be used as an index type.
    const reactionCounts = Object.values(post.reactions || {}).reduce((acc, reaction: string) => {
        acc[reaction] = (acc[reaction] || 0) + 1;
        return acc;
    }, {} as { [key: string]: number });

    const userReaction = currentUserId ? post.reactions?.[currentUserId] : null;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden transition-transform duration-300 hover:-translate-y-1">
            <div className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xl" style={{ backgroundColor: post.color }}>
                        {post.name?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-800 dark:text-white">{post.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(post.timestamp)}</p>
                    </div>
                </div>
                {post.caption && <p className="text-gray-700 dark:text-gray-300 mb-4">{post.caption}</p>}
                {post.imageURL && <img src={post.imageURL} alt={post.caption || 'Post image'} className="w-full max-h-[500px] object-cover rounded-lg mb-4" loading="lazy" />}

                <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 group">
                    <p className="font-mono text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap overflow-hidden text-ellipsis">{post.prompt}</p>
                    <div className="flex justify-end mt-2">
                         <button onClick={() => handleCopy(post.prompt, 'prompt')} className="flex items-center gap-2 text-xs font-semibold text-primary-600 hover:text-primary-700 dark:hover:text-primary-500 transition-colors">
                            <Copy size={14} />
                            {copied ? 'Copied!' : 'Copy Prompt'}
                        </button>
                    </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                        {Object.entries(reactionIcons).map(([type, icon]) => (
                            <button
                                key={type}
                                onClick={() => onReact(post.id, type)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors text-sm ${userReaction === type ? 'bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-400' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                            >
                                {icon}
                                <span className="font-medium">{reactionCounts[type] || 0}</span>
                            </button>
                        ))}
                    </div>
                     <button onClick={() => handleCopy(`${window.location.origin}/#/feed?id=${post.id}`, 'link')} className="flex items-center gap-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-500 transition-colors">
                        <Link2 size={16} />
                         <span className="text-sm font-medium hidden sm:inline">{linkCopied ? 'Link Copied!' : 'Share'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
});


const FeedPage: React.FC = () => {
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const [userCache, setUserCache] = useState<UserCache>({});
    const [searchTerm, setSearchTerm] = useState('');

    const { currentUser } = useAuth();
    const PAGE_SIZE = 5;

    const randomColor = () => ["#3b82f6","#ef4444","#22c55e","#a855f7","#f97316","#14b8a6"][Math.floor(Math.random()*6)];

    const loadUsersForPosts = useCallback(async (postsData: DocumentData[]) => {
        const uidsToLoad = [...new Set(postsData.map(p => p.uid).filter(uid => uid && !userCache[uid]))];
        if (uidsToLoad.length === 0) return userCache;

        const newCache = { ...userCache };
        await Promise.all(uidsToLoad.map(async (uid) => {
            try {
                const userSnap = await getDoc(doc(db, "users", uid));
                if (userSnap.exists()) {
                    const data = userSnap.data();
                    newCache[uid] = data.name || data.username || "Anonymous";
                } else {
                    newCache[uid] = "Anonymous";
                }
            } catch {
                newCache[uid] = "Anonymous";
            }
        }));
        setUserCache(newCache);
        return newCache;
    }, [userCache]);
    
    const fetchPosts = useCallback(async (initial = false) => {
        if (!hasMore && !initial) return;
        setLoading(true);

        const postsQuery = initial
            ? query(collection(db, "posts"), where("approved", "==", true), orderBy("timestamp", "desc"), limit(PAGE_SIZE))
            : query(collection(db, "posts"), where("approved", "==", true), orderBy("timestamp", "desc"), startAfter(lastDoc), limit(PAGE_SIZE));

        const postSnap = await getDocs(postsQuery);
        if (postSnap.empty) {
            setHasMore(false);
            setLoading(false);
            return;
        }

        const newPostsData = postSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const cache = await loadUsersForPosts(newPostsData);
        
        const newPosts = newPostsData.map(p => ({
            ...p,
            name: cache[p.uid] || "Anonymous",
            color: randomColor(),
        })) as Post[];
        
        setPosts(prev => initial ? newPosts : [...prev, ...newPosts]);
        setLastDoc(postSnap.docs[postSnap.docs.length - 1]);
        setHasMore(postSnap.docs.length === PAGE_SIZE);
        setLoading(false);
    }, [hasMore, lastDoc, loadUsersForPosts]);


    useEffect(() => {
        fetchPosts(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const handleScroll = useCallback(() => {
        if (window.innerHeight + document.documentElement.scrollTop + 100 < document.documentElement.offsetHeight || loading) {
            return;
        }
        fetchPosts();
    }, [loading, fetchPosts]);

    useEffect(() => {
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [handleScroll]);


    const handleReact = async (postId: string, type: string) => {
        if (!currentUser) return alert("Please login to react.");
        const postRef = doc(db, "posts", postId);
        await updateDoc(postRef, { [`reactions.${currentUser.uid}`]: type });
    };
    
    const filteredPosts = posts.filter(post => 
        (post.caption && post.caption.toLowerCase().includes(searchTerm.toLowerCase())) ||
        post.prompt.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <MotionPage className="max-w-3xl mx-auto px-4 py-8 animate-fade-in-up">
            <div className="mb-6">
                <input
                    type="search"
                    placeholder="Search by prompt, caption, or author..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow shadow-sm"
                />
            </div>

            <div className="space-y-6">
                {filteredPosts.map(post => (
                    <PostCard key={post.id} post={post} onReact={handleReact} currentUserId={currentUser?.uid} />
                ))}
            </div>

            {loading && (
                <div className="flex justify-center items-center py-8">
                    <div className="w-8 h-8 border-4 border-primary-500 border-dashed rounded-full animate-spin"></div>
                </div>
            )}

            {!hasMore && !loading && (
                 <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <p>You've reached the end of the universe.</p>
                </div>
            )}
        </MotionPage>
    );
};

export default FeedPage;