import React, { useState } from 'react';
import { COLLECTION_HTML, MASS_HTML } from '../content/communityCollection';
import './CommunityCollection.css';

export default function CommunityCollection({ play = false }: { play?: boolean }) {
    const [started, setStarted] = useState(false);
    return <div className="community-collection">
        <p className="collection-eyebrow">MORE GAMES · PLAY HERE</p>
        <h1>{play ? 'Mass — Build a Solar System' : 'Space Clicker Games Collection'}</h1>
        {play && <section aria-label="Mass game player" className="collection-player">
            <p>Session-only progress · Reloading starts over · Click Play to load the game.</p>
            <button type="button" onClick={() => setStarted(!started)}>{started ? 'Unload game' : 'Play Mass'}</button>
            {started && <iframe title="Mass solar-system clicker" src="/community-assets/mass/player.html" sandbox="allow-scripts" allow="fullscreen" allowFullScreen />}
        </section>}
        <article dangerouslySetInnerHTML={{ __html: play ? MASS_HTML : COLLECTION_HTML }} />
    </div>;
}
