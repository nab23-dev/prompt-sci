
import React from 'react';
import { Link } from 'react-router-dom';
import MotionPage from '../components/MotionPage';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <MotionPage className="bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white">Privacy Policy</h1>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">Last updated: October 3, 2025</p>
          </div>
          
          <div className="prose prose-lg dark:prose-invert max-w-none text-gray-600 dark:text-gray-300">
            <p>Prompt Scientist ("we", "our", or "us") operates <Link to="/" className="text-primary-600 hover:text-primary-700">prompt-sci.pro</Link>. We respect your privacy and are committed to protecting your personal information. This Privacy Policy explains what data we collect, how we use it, and your rights.</p>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-8">1. Information We Collect</h2>
            <p>When you register for an account, we collect:</p>
            <ul>
              <li>Full name</li>
              <li>Username</li>
              <li>Email address (for account verification and communication)</li>
              <li>Password (securely hashed)</li>
            </ul>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-8">2. How We Use Your Information</h2>
            <p>Your information is used solely to:</p>
            <ul>
              <li>Create and manage your account and profile.</li>
              <li>Authenticate and secure user access.</li>
              <li>Enable sharing and discovery of prompts.</li>
              <li>Send essential account and security notifications.</li>
            </ul>
            <p>We do not sell or rent personal information to third parties.</p>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-8">3. Data Security</h2>
            <p>We implement reasonable technical safeguards to protect personal data. Passwords are hashed and salted. Despite these measures, no internet-based system can be guaranteed 100% secure.</p>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-8">4. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal information through your account management page. For further assistance, please contact us.</p>
            
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mt-8">5. Contact Us</h2>
            <p>For privacy questions or requests, please email us at <a href="mailto:prompt.scientist.23@gmail.com" className="text-primary-600 hover:text-primary-700">prompt.scientist.23@gmail.com</a>.</p>
          </div>
          <div className="text-center mt-12">
            <Link to="/" className="text-primary-600 hover:text-primary-700 font-semibold">
              &larr; Back to Home
            </Link>
          </div>
        </div>
      </div>
    </MotionPage>
  );
};

export default PrivacyPolicyPage;
