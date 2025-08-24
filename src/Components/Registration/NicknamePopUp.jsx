// components/NicknamePopup.js
import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../Context/AuthContext'; // Assuming you have auth context

const NicknamePopup = ({ onClose }) => {
  const [nickname, setNickname] = useState('');
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nickname.trim()) return;

    try {
      // Save to /users/{uid}
      await setDoc(doc(db, 'users', currentUser.uid), {
        nickname,
        createdAt: new Date(),
      }, { merge: true });
      onClose();
    } catch (error) {
      console.error("Error saving nickname:", error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Welcome!</h2>
        <p className="mb-4">Please enter a nickname to continue</p>
        
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="CoolStudent123"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Save & Continue
          </button>
        </form>
      </div>
    </div>
  );
};

export default NicknamePopup;