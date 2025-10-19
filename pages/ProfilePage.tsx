
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../services/firebase';
import { signOut } from 'firebase/auth';
import { getDoc, doc, collection, addDoc, serverTimestamp, query, where, getDocs, deleteDoc, orderBy, Timestamp } from 'firebase/firestore';
import MotionPage from '../components/MotionPage';
import { Edit, LogOut, Image, Type, Send, Trash2, Clock, CheckCircle, PlusCircle } from 'lucide-react';

interface UserData {
    name: string;
    username: string;
    email: string;
    createdAt: string;
}

interface Post {
    id: string;
    caption?: string;
    prompt: string;
    imageURL?: string;
    timestamp: Timestamp;
    approved: boolean;
}

const ProfilePage: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [userData, setUserData] = useState<UserData | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [imageURL, setImageURL] = useState('');
    const [caption, setCaption] = useState('');
    const [prompt, setPrompt] = useState('');

    const fetchUserData = useCallback(async () => {
        if (currentUser) {
            const userRef = doc(db, 'users', currentUser.uid);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                setUserData(userSnap.data() as UserData);
            }
        }
    }, [currentUser]);

    const fetchUserPosts = useCallback(async () => {
        if (currentUser) {
            setLoading(true);
            const q = query(collection(db, 'posts'), where('uid', '==', currentUser.uid), orderBy('timestamp', 'desc'));
            const snap = await getDocs(q);
            const userPosts = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            setPosts(userPosts);
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        fetchUserData();
        fetchUserPosts();
    }, [fetchUserData, fetchUserPosts]);

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };
    
    const handlePostSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!prompt.trim() || !currentUser || !userData) {
            alert('Prompt is required.');
            return;
        }
        setSubmitting(true);
        try {
            const settingsRef = doc(db, "settings", "global");
            const settingsSnap = await getDoc(settingsRef);
            const autoApprove = settingsSnap.exists() && settingsSnap.data().autoApprove === true;

            await addDoc(collection(db, 'posts'), {
                uid: currentUser.uid,
                name: userData.name,
                username: userData.username,
                email: userData.email,
                imageURL: imageURL.trim(),
                caption: caption.trim(),
                prompt: prompt.trim(),
                timestamp: serverTimestamp(),
                approved: autoApprove,
                reactions: {}
            });
            alert('Post submitted successfully!');
            setImageURL('');
            setCaption('');
            setPrompt('');
            fetchUserPosts();
        } catch (error) {
            console.error("Error submitting post: ", error);
            alert('Failed to submit post.');
        } finally {
            setSubmitting(false);
        }
    };
    
    const handleDeletePost = async (postId: string) => {
        if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
            try {
                await deleteDoc(doc(db, 'posts', postId));
                alert('Post deleted successfully.');
                setPosts(posts.filter(p => p.id !== postId));
            } catch (error) {
                console.error("Error deleting post: ", error);
                alert('Failed to delete post.');
            }
        }
    };

    if (!userData) {
        return <div className="flex items-center justify-center h-screen"><div className="w-16 h-16 border-4 border-primary-500 border-dashed rounded-full animate-spin"></div></div>;
    }

    return (
        <MotionPage className="max-w-5xl mx-auto px-4 py-8 space-y-8">
            {/* Profile Header */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 flex flex-col sm:flex-row items-center gap-6 animate-fade-in">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white text-4xl font-bold shadow-md">
                    {userData.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 text-center sm:text-left">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{userData.name}</h1>
                    <p className="text-gray-500 dark:text-gray-400">@{userData.username}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{userData.email}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                        Member since {new Date(userData.createdAt).toLocaleDateString()}
                    </p>
                </div>
                <div className="flex gap-3 mt-4 sm:mt-0">
                    <button onClick={() => navigate('/account-manage')} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-sm">
                        <Edit size={16} /> Manage
                    </button>
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                        <LogOut size={16} /> Logout
                    </button>
                </div>
            </div>

            {/* Create Post Form */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><PlusCircle size={24}/> Create New Post</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    Use a service like <a href="https://postimages.org/" target="_blank" rel="noopener noreferrer" className="text-primary-500 hover:underline">postimages.org</a> and paste the 'Direct link' for your image.
                </p>
                <form onSubmit={handlePostSubmit} className="space-y-4">
                    <InputField icon={<Image size={18}/>} id="imageURL" label="Image URL (Direct link)" value={imageURL} onChange={setImageURL} placeholder="https://i.postimg.cc/..."/>
                    <InputField icon={<Type size={18}/>} id="caption" label="Caption (optional)" value={caption} onChange={setCaption} placeholder="A short, catchy caption"/>
                    <div>
                        <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prompt (required)</label>
                        <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} required placeholder="Your detailed AI prompt..." rows={4} className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow"/>
                    </div>
                    <button type="submit" disabled={submitting} className="w-full flex justify-center items-center gap-2 bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:bg-primary-400">
                        <Send size={18} />
                        {submitting ? 'Submitting...' : 'Submit Post'}
                    </button>
                </form>
            </div>

            {/* My Posts */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
                 <h2 className="text-2xl font-bold mb-4">My Posts</h2>
                 {loading ? <div className="text-center py-4">Loading posts...</div> : posts.length === 0 ? <p className="text-center text-gray-500 py-4">You haven't created any posts yet.</p> :
                 <div className="space-y-4">
                     {posts.map(post => (
                         <div key={post.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 flex flex-col sm:flex-row gap-4 items-start">
                             {post.imageURL && <img src={post.imageURL} alt={post.caption || 'Post'} className="w-full sm:w-32 h-32 object-cover rounded-md"/>}
                             <div className="flex-1">
                                 <p className="font-semibold">{post.caption || '(No caption)'}</p>
                                 <p className="text-sm font-mono text-gray-500 dark:text-gray-400 mt-1 truncate">{post.prompt}</p>
                                 <div className="text-xs text-gray-400 mt-2 flex items-center gap-4">
                                     <span className="flex items-center gap-1.5"><Clock size={12}/> {post.timestamp.toDate().toLocaleDateString()}</span>
                                     <span className={`flex items-center gap-1.5 font-semibold ${post.approved ? 'text-green-500' : 'text-yellow-500'}`}>
                                        {post.approved ? <><CheckCircle size={12}/> Approved</> : 'Pending'}
                                     </span>
                                 </div>
                             </div>
                             <button onClick={() => handleDeletePost(post.id)} className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-full transition-colors">
                                 <Trash2 size={18} />
                             </button>
                         </div>
                     ))}
                 </div>
                 }
            </div>
        </MotionPage>
    );
};

const InputField: React.FC<{icon: React.ReactNode, id: string, label: string, value: string, onChange: (val: string) => void, placeholder: string}> = ({icon, id, label, value, onChange, placeholder}) => (
    <div>
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</span>
            <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow"/>
        </div>
    </div>
);

export default ProfilePage;
