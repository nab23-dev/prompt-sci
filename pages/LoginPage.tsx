
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDocs, query, where, collection } from 'firebase/firestore';
import MotionPage from '../components/MotionPage';

type FormType = 'login' | 'signup';

const LoginPage: React.FC = () => {
    const [formType, setFormType] = useState<FormType>('signup');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const navigate = useNavigate();
    const { currentUser } = useAuth();
    
    useEffect(() => {
        if (currentUser) {
            navigate('/feed');
        }
    }, [currentUser, navigate]);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!name || !username || !email || !password) {
            setError("Please fill in all fields.");
            setLoading(false);
            return;
        }
        if (username.length < 4) {
            setError("Username must be at least 4 characters.");
            setLoading(false);
            return;
        }
        if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) {
            setError("Please use a valid Gmail address.");
            setLoading(false);
            return;
        }
        if (password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        try {
            const q = query(collection(db, "users"), where("username", "==", username));
            const qs = await getDocs(q);
            if (!qs.empty) {
                throw new Error("Username already taken.");
            }
            
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCred.user.uid), {
                uid: userCred.user.uid,
                name,
                username,
                email,
                createdAt: new Date().toISOString()
            });
            navigate('/feed');

        } catch (err: any) {
            setError(err.message || 'Failed to create an account.');
        } finally {
            setLoading(false);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (!email || !password) {
            setError("Please fill in all fields.");
            setLoading(false);
            return;
        }
        
        try {
            let loginEmail = email;
            if (!email.includes('@')) {
                const q = query(collection(db, "users"), where("username", "==", email));
                const qs = await getDocs(q);
                if (qs.empty) throw new Error("No user found with this username.");
                loginEmail = qs.docs[0].data().email;
            }
            await signInWithEmailAndPassword(auth, loginEmail, password);
            navigate('/feed');
        } catch (err: any) {
            setError(err.message || 'Failed to login.');
        } finally {
            setLoading(false);
        }
    };


    return (
        <MotionPage className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-16">
                
                <div className="text-center md:text-left animate-fade-in-up">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white">
                        Prompt
                        <span className="text-primary-600"> Scientist</span>
                    </h1>
                    <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
                        Share your prompts, learn from others, and create AI-powered content together.
                    </p>
                </div>

                <div className="w-full max-w-md mx-auto animate-pop-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8">
                        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                            <button onClick={() => setFormType('signup')} className={`flex-1 py-3 font-semibold text-center transition-colors ${formType === 'signup' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                Sign Up
                            </button>
                            <button onClick={() => setFormType('login')} className={`flex-1 py-3 font-semibold text-center transition-colors ${formType === 'login' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                                Login
                            </button>
                        </div>
                        
                        <form onSubmit={formType === 'signup' ? handleSignup : handleLogin}>
                            {formType === 'signup' && (
                                <>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="signupName">Full Name</label>
                                        <input id="signupName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your full name" className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"/>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="signupUsername">Username</label>
                                        <input id="signupUsername" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="unique_username" className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"/>
                                    </div>
                                </>
                            )}
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="email">{formType === 'login' ? 'Email or Username' : 'Gmail'}</label>
                                <input id="email" type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"/>
                            </div>
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="password">Password</label>
                                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none"/>
                            </div>
                            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}
                            <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white font-semibold py-3 px-4 rounded-lg hover:bg-primary-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 disabled:bg-primary-400 disabled:cursor-not-allowed">
                                {loading ? 'Processing...' : formType === 'signup' ? 'Create Account' : 'Login'}
                            </button>
                        </form>
                    </div>
                </div>

            </div>
        </MotionPage>
    );
};

export default LoginPage;
