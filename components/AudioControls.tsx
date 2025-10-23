import React from 'react';

// Define icons outside the component to prevent re-creation on every render.
const MusicIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>;
const SfxIcon = () => <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="24" height="24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>;
    
export const AudioControlButton: React.FC<{isEnabled: boolean, onToggle: () => void, type: 'music' | 'sfx'}> = ({isEnabled, onToggle, type}) => {
    return (
        <button className="audio-control-button" onClick={onToggle} style={{ opacity: isEnabled ? 1 : 0.5 }} aria-label={`Toggle ${type}`}>
            {type === 'music' ? <MusicIcon /> : <SfxIcon />}
            {!isEnabled && <div className="audio-slash"></div>}
        </button>
    );
};

interface AudioControlsProps {
    isMusicEnabled: boolean;
    isSfxEnabled: boolean;
    onToggleMusic: () => void;
    onToggleSfx: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({ isMusicEnabled, isSfxEnabled, onToggleMusic, onToggleSfx }) => (
    <div className="audio-controls-container">
        <AudioControlButton isEnabled={isMusicEnabled} onToggle={onToggleMusic} type="music" />
        <AudioControlButton isEnabled={isSfxEnabled} onToggle={onToggleSfx} type="sfx" />
    </div>
);