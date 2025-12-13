import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Dashboard } from './components/Dashboard';
import { PropertyForm } from './components/PropertyForm';

const App: React.FC = () => {
  return (
    <HashRouter>
      <div className="min-h-screen font-sans text-gray-900">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/novo" element={<PropertyForm />} />
          <Route path="/editar/:id" element={<PropertyForm />} />
        </Routes>
      </div>
    </HashRouter>
  );
};

export default App;