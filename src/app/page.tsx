// app/page.tsx
import React from 'react';
import CanvasComponent from './components/CanvasComponent.client';

export default function Page() {
  return (
    <div>
      <h1>Dynamic Canvas with Next.js</h1>
      <CanvasComponent />
    </div>
  );
}
