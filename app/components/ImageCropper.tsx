"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Minus, Plus, RotateCcw, X } from "lucide-react";

type Props = {
  file: File;
  aspectRatio: number;
  title: string;
  onCancel: () => void;
  onApply: (file: File) => void;
};

export default function ImageCropper({ file, aspectRatio, title, onCancel, onApply }: Props) {
  const [source, setSource] = useState("");
  const [zoom, setZoom] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSource(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function apply() {
    const image = imageRef.current;
    if (!image?.naturalWidth || !image.naturalHeight) return;
    const width = aspectRatio === 16 / 9 ? 2560 : 1200;
    const height = Math.round(width / aspectRatio);
    const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight) * zoom;
    const drawWidth = image.naturalWidth * scale;
    const drawHeight = image.naturalHeight * scale;
    const dx = (width - drawWidth) / 2 + (x / 100) * (drawWidth - width);
    const dy = (height - drawHeight) / 2 + (y / 100) * (drawHeight - height);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return;
    context.fillStyle = "#111";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, dx, dy, drawWidth, drawHeight);
    canvas.toBlob(blob => {
      if (!blob) return;
      const name = file.name.replace(/\.[^.]+$/, "") + "-connect.jpg";
      onApply(new File([blob], name, { type: "image/jpeg", lastModified: Date.now() }));
    }, "image/jpeg", 0.92);
  }

  return (
    <div className="crop-backdrop" role="dialog" aria-modal="true" aria-label={title}>
      <section className="crop-dialog">
        <header><div><small>AJUSTE SUA IMAGEM</small><h2>{title}</h2></div><button type="button" onClick={onCancel} aria-label="Fechar"><X/></button></header>
        <div className="crop-preview-wrap">
          <div className="crop-preview" style={{aspectRatio,width:`min(100%, ${48*aspectRatio}vh)`}}>
            {source && <img ref={imageRef} src={source} alt="Prévia do corte" style={{objectPosition: `${50 - x}% ${50 - y}%`, transform: `scale(${zoom})`}}/>}
          </div>
          <p>Ajuste o enquadramento. O quadro mostra exatamente o formato que será salvo.</p>
        </div>
        <div className="crop-controls">
          <label>Zoom <div><Minus size={15}/><input type="range" min="1" max="3" step="0.01" value={zoom} onChange={e=>setZoom(Number(e.target.value))}/><Plus size={15}/></div></label>
          <label>Horizontal <input type="range" min="-50" max="50" value={x} onChange={e=>setX(Number(e.target.value))}/></label>
          <label>Vertical <input type="range" min="-50" max="50" value={y} onChange={e=>setY(Number(e.target.value))}/></label>
        </div>
        <footer><button type="button" className="secondary" onClick={()=>{setZoom(1);setX(0);setY(0);}}><RotateCcw size={15}/> Redefinir</button><button type="button" className="primary" onClick={apply}><Check size={16}/> Usar esta imagem</button></footer>
      </section>
    </div>
  );
}
