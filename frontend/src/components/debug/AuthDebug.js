import React from 'react';
import { useAuth } from '../../context/AuthContext';

const AuthDebug = () => {
  const { user, isAuthenticated } = useAuth();
  
  // Also check localStorage directly
  const localStorageUser = localStorage.getItem('beacon_user');
  let parsedUser = null;
  try {
    parsedUser = localStorageUser ? JSON.parse(localStorageUser) : null;
  } catch (error) {
    console.error('Error parsing user from localStorage:', error);
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-bold text-sm mb-2">🔍 Auth Debug</h3>
      
      <div className="text-xs space-y-1">
        <div>
          <strong>Auth Context:</strong>
        </div>
        <div>• Authenticated: {isAuthenticated ? '✅' : '❌'}</div>
        <div>• User: {user ? `${user.email} (${user.role})` : 'None'}</div>
        <div>• User ID: {user?.id || 'None'}</div>
        
        <div className="mt-2">
          <strong>localStorage:</strong>
        </div>
        <div>• Has Data: {localStorageUser ? '✅' : '❌'}</div>
        <div>• User: {parsedUser ? `${parsedUser.email} (${parsedUser.role})` : 'None'}</div>
        <div>• User ID: {parsedUser?.id || 'None'}</div>
        
        <div className="mt-2">
          <strong>API Headers:</strong>
        </div>
        <div>• user-id: {parsedUser?.id || 'Not Set'}</div>
      </div>
    </div>
  );
};

export default AuthDebug;
