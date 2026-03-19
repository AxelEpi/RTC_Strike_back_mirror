"use client";
import { useState } from 'react';
import { createServerInvite } from '../../lib/api';

export default function InviteButton({ serverId, userRole }) {
  const [loading, setLoading] = useState(false);
  const [lastInvite, setLastInvite] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  const handleCreateInvite = async () => {
    if (loading) return;
    
    setLoading(true);
    setLastInvite(null);
    
    try {
      const invite = await createServerInvite(serverId);
      setLastInvite(invite);
      
      // Copie automatique du lien complet
      const fullUrl = `${window.location.origin}/join/${invite.code}`;
      await navigator.clipboard.writeText(fullUrl);
      
      // Notification toast
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
      
    } catch (error) {
      console.error('Erreur création invitation:', error);
      alert('Erreur: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sécurité: seuls OWNER et ADMIN
  if (userRole !== 'OWNER' && userRole !== 'ADMIN') {
    return null;
  }

  return (
    <>
      {/* Bouton principal */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleCreateInvite}
          disabled={loading}
          className="group relative flex items-center justify-center gap-3 px-6 py-3 
                     bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 
                     hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 
                     text-white font-semibold rounded-2xl shadow-xl 
                     hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 
                     disabled:opacity-50 disabled:cursor-not-allowed 
                     focus:outline-none focus:ring-4 focus:ring-purple-500/50"
          title="Créer un lien d'invitation permanent (7 jours, usages illimités)"
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Création...</span>
            </>
          ) : (
            <>
              <span className="text-lg group-hover:scale-110 transition-transform duration-200">
                
              </span>
              <span>Créer une invitation</span>
            </>
          )}
        </button>

        {/* Dernier code généré */}
        {lastInvite && (
          <div className="flex items-center gap-2 p-3 bg-gray-900/80 border border-gray-700 rounded-xl backdrop-blur-sm group/last">
            <code className="text-sm font-mono text-gray-300 flex-1 truncate bg-gray-800/50 px-3 py-1 rounded-lg">
              /join/{lastInvite.code}
            </code>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/join/${lastInvite.code}`);
                setShowNotification(true);
                setTimeout(() => setShowNotification(false), 1500);
              }}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-all hover:scale-105 group-hover/last:bg-gray-600/50"
              title="Copier le lien complet (https://monapp.com/join/ABC123)"
            >
              📋
            </button>
          </div>
        )}
      </div>

      {/* Toast notification */}
      {showNotification && (
        <div className="fixed top-4 right-4 z-50 p-4 rounded-xl shadow-2xl transform 
                        bg-gradient-to-r from-emerald-500 to-teal-600 text-white 
                        translate-x-full transition-all duration-300">
          Lien copié dans le presse-papier !
          <br />
          <span className="text-sm opacity-90 font-mono">/join/{lastInvite?.code}</span>
        </div>
      )}
    </>
  );
}
