
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../services/firebase';
import { updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from 'firebase/auth';
import { doc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import MotionPage from '../components/MotionPage';
import { User, ShieldCheck, Mail, Lock, Trash2, X } from 'lucide-react';

const AccountManagementPage: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [name, setName] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    
    const [updateMessage, setUpdateMessage] = useState({ type: '', text: '' });
    const [isUpdating, setIsUpdating] = useState(false);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteMessage, setDeleteMessage] = useState({ type: '', text: '' });
    const [isDeleting, setIsDeleting] = useState(false);
    
    useEffect(() => {
        if (!currentUser) navigate('/');
    }, [currentUser, navigate]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentPassword) {
            setUpdateMessage({ type: 'error', text: 'Current password is required to make changes.' });
            return;
        }
        setIsUpdating(true);
        setUpdateMessage({ type: '', text: '' });

        if (!currentUser || !currentUser.email) {
            setUpdateMessage({ type: 'error', text: 'User not found.' });
            setIsUpdating(false);
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
            await reauthenticateWithCredential(currentUser, credential);
            
            const promises = [];
            if (name.trim()) {
                promises.push(updateDoc(doc(db, "users", currentUser.uid), { name: name.trim() }));
            }
            if (newEmail.trim()) {
                promises.push(updateEmail(currentUser, newEmail.trim()));
                promises.push(updateDoc(doc(db, "users", currentUser.uid), { email: newEmail.trim() }));
            }
            if (newPassword) {
                promises.push(updatePassword(currentUser, newPassword));
            }
            
            await Promise.all(promises);

            setUpdateMessage({ type: 'success', text: 'Account updated successfully!' });
            setName('');
            setNewEmail('');
            setNewPassword('');
            setCurrentPassword('');

        } catch (err: any) {
            setUpdateMessage({ type: 'error', text: err.message || 'Failed to update account.' });
        } finally {
            setIsUpdating(false);
        }
    };
    
    const handleDeleteAccount = async () => {
        if (!deletePassword) {
            setDeleteMessage({ type: 'error', text: 'Please enter your password.' });
            return;
        }
        setIsDeleting(true);
        setDeleteMessage({ type: '', text: '' });

        if (!currentUser || !currentUser.email) {
            setDeleteMessage({ type: 'error', text: 'User not found.' });
            setIsDeleting(false);
            return;
        }

        try {
            const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
            await reauthenticateWithCredential(currentUser, credential);

            // Delete user data from Firestore
            await deleteDoc(doc(db, "users", currentUser.uid));
            const collectionsToDelete = ["posts", "messages"];
            for (const colName of collectionsToDelete) {
                const q = query(collection(db, colName), where("userId", "==", currentUser.uid));
                const snap = await getDocs(q);
                for (const d of snap.docs) {
                    await deleteDoc(doc(db, colName, d.id));
                }
            }

            // Delete Firebase Auth user
            await deleteUser(currentUser);
            
            setDeleteMessage({ type: 'success', text: 'Account deleted. Redirecting...' });
            setTimeout(() => navigate('/'), 2000);

        } catch (err: any) {
             setDeleteMessage({ type: 'error', text: err.message || 'Failed to delete account.' });
        } finally {
             setIsDeleting(false);
        }
    };

    return (
        <MotionPage className="max-w-3xl mx-auto px-4 py-8 space-y-8">
            <h1 className="text-4xl font-bold text-center text-gray-900 dark:text-white">Account Management</h1>
            
            {/* Update Profile Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 animate-fade-in-up">
                <h2 className="text-2xl font-bold mb-4">Update Profile</h2>
                <form onSubmit={handleUpdate} className="space-y-4">
                    <InputField icon={<User size={18}/>} id="updateName" type="text" value={name} onChange={setName} placeholder="New Full Name (optional)" />
                    <InputField icon={<Mail size={18}/>} id="updateEmail" type="email" value={newEmail} onChange={setNewEmail} placeholder="New Email (optional)" />
                    <InputField icon={<Lock size={18}/>} id="updatePassword" type="password" value={newPassword} onChange={setNewPassword} placeholder="New Password (optional)" />
                    <InputField icon={<ShieldCheck size={18}/>} id="currentPassword" type="password" value={currentPassword} onChange={setCurrentPassword} placeholder="Current Password (required)" required />
                    {updateMessage.text && <p className={`${updateMessage.type === 'error' ? 'text-red-500' : 'text-green-500'} text-sm`}>{updateMessage.text}</p>}
                    <button type="submit" disabled={isUpdating} className="w-full bg-primary-600 text-white font-semibold py-3 rounded-lg hover:bg-primary-700 transition-transform transform hover:scale-105 disabled:bg-primary-400">
                        {isUpdating ? 'Updating...' : 'Update Account'}
                    </button>
                </form>
            </div>

            {/* Delete Account Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-transparent dark:border-danger-700/50 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                <h2 className="text-2xl font-bold text-danger-600 dark:text-danger-500 mb-2">Delete Account</h2>
                <p className="text-gray-500 dark:text-gray-400 mb-4">Once your account is deleted, all of its resources and data will be permanently removed. This action cannot be undone.</p>
                <button onClick={() => setIsModalOpen(true)} className="w-full bg-danger-600 text-white font-semibold py-3 rounded-lg hover:bg-danger-700 transition-transform transform hover:scale-105">
                    Delete My Account
                </button>
            </div>
            
            {/* Delete Confirmation Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-md w-full m-4 relative animate-pop-in">
                         <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                             <X size={24}/>
                         </button>
                        <h3 className="text-xl font-bold mb-2">Confirm Account Deletion</h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-4">Enter your current password to permanently delete your account.</p>
                        <InputField icon={<Lock size={18}/>} id="deletePassword" type="password" value={deletePassword} onChange={setDeletePassword} placeholder="Current Password" required />
                        {deleteMessage.text && <p className={`${deleteMessage.type === 'error' ? 'text-red-500' : 'text-green-500'} text-sm mt-2`}>{deleteMessage.text}</p>}
                        <div className="flex gap-4 mt-6">
                            <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 font-semibold py-2 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                                Cancel
                            </button>
                            <button onClick={handleDeleteAccount} disabled={isDeleting} className="flex-1 flex items-center justify-center gap-2 bg-danger-600 text-white font-semibold py-2 rounded-lg hover:bg-danger-700 transition-colors disabled:bg-danger-400">
                                <Trash2 size={16}/> {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </MotionPage>
    );
};

const InputField: React.FC<{icon: React.ReactNode, id: string, type: string, value: string, onChange: (val: string) => void, placeholder: string, required?: boolean}> = ({icon, id, type, value, onChange, placeholder, required}) => (
    <div>
        <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">{icon}</span>
            <input id={id} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required={required} className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:outline-none transition-shadow"/>
        </div>
    </div>
);


export default AccountManagementPage;
