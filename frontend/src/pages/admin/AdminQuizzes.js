import React from 'react';
import { Trophy } from 'lucide-react';

const AdminQuizzes = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-2">
            Quiz Management
          </h2>
          <p className="text-gray-600">
            Quiz management features coming soon!
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminQuizzes;
