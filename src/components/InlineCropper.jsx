/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Crop, Check, RefreshCw, FlipHorizontal, FlipVertical, Grid } from 'lucide-react';

const CANVAS_PADDING = 20;

export default function InlineCropper({
  file,
  onSave,
  aspectRatioType,
  setAspectRatioType,
  flipH,
  setFlipH,
  flipV,
  setFlipV,
  showGrid,
  setShowGrid,
  onRegisterActions
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  const [image, setImage] = useState(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [renderSize, setRenderSize] = useState({ width: 0, height: 0 });
  const [isReady, setIsReady] = useState(false);
  const isLocked = aspectRatioType !== 'free';
  
  // Crop relative rectangle (relative constraints: 0 to 1)
  const [cropBox, setCropBox] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [activeHandle, setActiveHandle] = useState(null);
  const [hoverHandle, setHoverHandle] = useState(null);
  const [dragStart, setDragStart] = useState(null);

  // Re-load image when Selected File or its preview source shifts 
  useEffect(() => {
    if (!file || !file.previewUrl) return;

    setIsReady(false);
    setFlipH(false);
    setFlipV(false);
    setAspectRatioType('free');
    setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });

    const img = new Image();
    img.src = file.previewUrl;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      setImage(img);
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    };
  }, [file.id, file.previewUrl]);

  // Handle ResizeObserver to track container boundaries reactively
  useEffect(() => {
    if (!image || !containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      
      const width = entries[0].contentRect.width;
      // Cap height to a friendly inline aspect
      const height = Math.min(340, Math.max(220, width * 0.65));

      const imgRatio = naturalSize.width / naturalSize.height;
      const cardRatio = width / height;

      let finalW = width;
      let finalH = height;

      if (imgRatio > cardRatio) {
        finalW = width;
        finalH = width / imgRatio;
      } else {
        finalH = height;
        finalW = height * imgRatio;
      }

      setRenderSize({ width: finalW, height: finalH });
      setIsReady(true);
    });

    observer.observe(containerRef.current);
    
    return () => {
      observer.disconnect();
    };
  }, [image, naturalSize]);

  // Helper resolving locked aspect coefficients
  const getLockedAspect = () => {
    switch (aspectRatioType) {
      case 'original':
        return naturalSize.width / naturalSize.height;
      case '1:1':
        return 1.0;
      case '4:3':
        return 4 / 3;
      default:
        return 1.0;
    }
  };

  // Snaps the crop box boundaries immediately when the aspect ratio preset changes in the sidebar
  useEffect(() => {
    if (!isReady || !image) return;
    if (aspectRatioType === 'free') return;

    let ratio = 1.0;
    if (aspectRatioType === 'original') {
      ratio = naturalSize.width / naturalSize.height;
    } else if (aspectRatioType === '1:1') {
      ratio = 1.0;
    } else if (aspectRatioType === '4:3') {
      ratio = 4 / 3;
    }

    const relRatio = ratio * (renderSize.height / renderSize.width);
    
    let w = 0.85;
    let h = 0.85;
    
    if (relRatio > 1) {
      w = 0.85;
      h = w / relRatio;
      if (h > 0.85) {
        h = 0.85;
        w = h * relRatio;
      }
    } else {
      h = 0.85;
      w = h * relRatio;
      if (w > 0.85) {
        w = 0.85;
        h = w / relRatio;
      }
    }
    
    setCropBox({
      x: (1 - w) / 2,
      y: (1 - h) / 2,
      w,
      h
    });
  }, [aspectRatioType, isReady, renderSize.width, renderSize.height, naturalSize, image]);

  // Canvas Drawing Sequence
  useEffect(() => {
    if (!isReady || !image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = renderSize.width + CANVAS_PADDING * 2;
    canvas.height = renderSize.height + CANVAS_PADDING * 2;

    // Clear canvas with background color
    ctx.fillStyle = '#141211';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    if (flipH || flipV) {
      ctx.translate(renderSize.width / 2 + CANVAS_PADDING, renderSize.height / 2 + CANVAS_PADDING);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.translate(-(renderSize.width / 2 + CANVAS_PADDING), -(renderSize.height / 2 + CANVAS_PADDING));
    }
    ctx.drawImage(image, CANVAS_PADDING, CANVAS_PADDING, renderSize.width, renderSize.height);
    ctx.restore();

    // Dark screen on cropped region background
    ctx.fillStyle = 'rgba(12, 10, 9, 0.6)';
    
    const px = cropBox.x * renderSize.width + CANVAS_PADDING;
    const py = cropBox.y * renderSize.height + CANVAS_PADDING;
    const pw = cropBox.w * renderSize.width;
    const ph = cropBox.h * renderSize.height;

    ctx.fillRect(0, 0, canvas.width, py);
    ctx.fillRect(0, py + ph, canvas.width, canvas.height - (py + ph));
    ctx.fillRect(0, py, px, ph);
    ctx.fillRect(px + pw, py, canvas.width - (px + pw), ph);

    // Crop Outline
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.8;
    ctx.strokeRect(px, py, pw, ph);

    if (showGrid) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.setLineDash([4, 4]);
      
      ctx.beginPath();
      // Horiz
      ctx.moveTo(px, py + ph / 3);
      ctx.lineTo(px + pw, py + ph / 3);
      ctx.moveTo(px, py + (2 * ph) / 3);
      ctx.lineTo(px + pw, py + (2 * ph) / 3);
      // Vert
      ctx.moveTo(px + pw / 3, py);
      ctx.lineTo(px + pw / 3, py + ph);
      ctx.moveTo(px + (2 * pw) / 3, py);
      ctx.lineTo(px + (2 * pw) / 3, py + ph);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Handles
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#1c1917';
    ctx.lineWidth = 1.5;

    const drawHandle = (hx, hy) => {
      ctx.beginPath();
      ctx.arc(hx, hy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    };

    drawHandle(px, py);
    drawHandle(px + pw, py);
    drawHandle(px, py + ph);
    drawHandle(px + pw, py + ph);
    drawHandle(px + pw / 2, py);
    drawHandle(px + pw / 2, py + ph);
    drawHandle(px, py + ph / 2);
    drawHandle(px + pw, py + ph / 2);

    // Target overlay resolution calculation
    const targetW = Math.round(cropBox.w * naturalSize.width);
    const targetH = Math.round(cropBox.h * naturalSize.height);
    const label = `${targetW} × ${targetH} PX`;

    ctx.font = `bold 10px ui-monospace, SFMono-Regular, sans-serif`;
    const labelWidth = ctx.measureText(label).width;
    const badgeW = labelWidth + 12;
    const badgeH = 18;

    let bx = px + pw / 2 - badgeW / 2;
    let by = py + ph - badgeH - 6;

    if (by < py + 6) by = py + 6;
    if (bx < px + 6) bx = px + 6;
    if (bx + badgeW > canvas.width - 6) bx = canvas.width - badgeW - 6;
    if (by + badgeH > canvas.height - 6) by = canvas.height - badgeH - 6;

    ctx.fillStyle = 'rgba(12, 10, 9, 0.85)';
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    ctx.rect(bx, by, badgeW, badgeH);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(label, bx + 6, by + 4);

  }, [isReady, image, renderSize, cropBox, flipH, flipV, showGrid, naturalSize]);

  const getHitHandle = (clientX, clientY) => {
    if (!canvasRef.current) return null;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const scaleX = rect.width / canvasRef.current.width;
    const scaleY = rect.height / canvasRef.current.height;

    const px = (cropBox.x * renderSize.width + CANVAS_PADDING) * scaleX;
    const py = (cropBox.y * renderSize.height + CANVAS_PADDING) * scaleY;
    const pw = (cropBox.w * renderSize.width) * scaleX;
    const ph = (cropBox.h * renderSize.height) * scaleY;

    const threshold = 24;

    const distTL = Math.hypot(x - px, y - py);
    const distTR = Math.hypot(x - (px + pw), y - py);
    const distBL = Math.hypot(x - px, y - (py + ph));
    const distBR = Math.hypot(x - (px + pw), y - (py + ph));

    if (distTL < threshold) return 'tl';
    if (distTR < threshold) return 'tr';
    if (distBL < threshold) return 'bl';
    if (distBR < threshold) return 'br';

    // Edge centers
    const distTC = Math.hypot(x - (px + pw / 2), y - py);
    const distBC = Math.hypot(x - (px + pw / 2), y - (py + ph));
    const distLC = Math.hypot(x - px, y - (py + ph / 2));
    const distRC = Math.hypot(x - (px + pw), y - (py + ph / 2));

    if (distTC < threshold) return 'tc';
    if (distBC < threshold) return 'bc';
    if (distLC < threshold) return 'lc';
    if (distRC < threshold) return 'rc';

    if (x >= px && x <= px + pw && y >= py && y <= py + ph) {
      return 'center';
    }

    return null;
  };

  const currentCursor = () => {
    if (activeHandle) {
      if (activeHandle === 'center') return 'cursor-move';
      if (['tl', 'br'].includes(activeHandle)) return 'cursor-nwse-resize';
      if (['tr', 'bl'].includes(activeHandle)) return 'cursor-nesw-resize';
      if (['tc', 'bc'].includes(activeHandle)) return 'cursor-ns-resize';
      if (['lc', 'rc'].includes(activeHandle)) return 'cursor-ew-resize';
      return 'cursor-crosshair';
    }
    if (hoverHandle) {
         if (hoverHandle === 'center') return 'cursor-move';
         if (['tl', 'br'].includes(hoverHandle)) return 'cursor-nwse-resize';
         if (['tr', 'bl'].includes(hoverHandle)) return 'cursor-nesw-resize';
         if (['tc', 'bc'].includes(hoverHandle)) return 'cursor-ns-resize';
         if (['lc', 'rc'].includes(hoverHandle)) return 'cursor-ew-resize';
    }
    return 'cursor-default';
  };

  const startDrag = (clientX, clientY, hitX, hitY) => {
    const handle = getHitHandle(clientX, clientY);

    if (handle) {
      setActiveHandle(handle);
      setDragStart({
        x: clientX,
        y: clientY,
        boxX: cropBox.x,
        boxY: cropBox.y,
        boxW: cropBox.w,
        boxH: cropBox.h
      });
    } else {
      setActiveHandle('draw');
      setDragStart({
        x: clientX,
        y: clientY,
        boxX: hitX,
        boxY: hitY,
        boxW: 0,
        boxH: 0
      });
    }
  };

  const moveDrag = (clientX, clientY) => {
    if (!activeHandle || !dragStart || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width / canvasRef.current.width;
    const scaleY = rect.height / canvasRef.current.height;

    const screenImageWidth = renderSize.width * scaleX;
    const screenImageHeight = renderSize.height * scaleY;

    const dx = (clientX - dragStart.x) / screenImageWidth;
    const dy = (clientY - dragStart.y) / screenImageHeight;

    let nextX = dragStart.boxX;
    let nextY = dragStart.boxY;
    let nextW = dragStart.boxW;
    let nextH = dragStart.boxH;

    const minSize = 0.05;

    if (activeHandle === 'draw') {
      const clickImageX = clientX - rect.left - CANVAS_PADDING * scaleX;
      const clickImageY = clientY - rect.top - CANVAS_PADDING * scaleY;
      const currX = Math.max(0, Math.min(1, clickImageX / screenImageWidth));
      const currY = Math.max(0, Math.min(1, clickImageY / screenImageHeight));

      const startX = dragStart.boxX;
      const startY = dragStart.boxY;

      let tempW = Math.abs(startX - currX);
      let tempH = Math.abs(startY - currY);

      if (isLocked) {
        const aspect = getLockedAspect();
        if (tempW / tempH > aspect) {
          tempW = tempH * aspect;
        } else {
          tempH = tempW / aspect;
        }
      }

      nextW = Math.max(minSize, tempW);
      nextH = Math.max(minSize, tempH);
      nextX = currX < startX ? startX - nextW : startX;
      nextY = currY < startY ? startY - nextH : startY;

      if (nextX < 0) nextX = 0;
      if (nextY < 0) nextY = 0;
      if (nextX + nextW > 1) {
        nextW = 1 - nextX;
        if (isLocked) {
          nextH = nextW / getLockedAspect();
        }
      }
      if (nextY + nextH > 1) {
        nextH = 1 - nextY;
        if (isLocked) {
          nextW = nextH * getLockedAspect();
        }
      }
    } else {
      if (isLocked) {
        const aspect = dragStart.boxW / dragStart.boxH;
        switch (activeHandle) {
          case 'center':
            nextX = Math.max(0, Math.min(1 - dragStart.boxW, dragStart.boxX + dx));
            nextY = Math.max(0, Math.min(1 - dragStart.boxH, dragStart.boxY + dy));
            break;
          case 'br': {
            nextW = dragStart.boxW + dx;
            const maxW = 1 - dragStart.boxX;
            const maxH = 1 - dragStart.boxY;
            nextW = Math.max(minSize, Math.min(maxW, maxH * aspect, nextW));
            nextH = nextW / aspect;
            break;
          }
          case 'bl': {
            nextX = Math.max(0, Math.min(dragStart.boxX + dragStart.boxW - minSize, dragStart.boxX + dx));
            nextW = dragStart.boxX + dragStart.boxW - nextX;
            const maxW = dragStart.boxX + dragStart.boxW;
            const maxH = 1 - dragStart.boxY;
            nextW = Math.min(maxW, maxH * aspect, nextW);
            nextX = dragStart.boxX + dragStart.boxW - nextW;
            nextH = nextW / aspect;
            break;
          }
          case 'tr': {
            nextW = Math.max(minSize, Math.min(1 - dragStart.boxX, dragStart.boxW + dx));
            const maxW = 1 - dragStart.boxX;
            const maxH = dragStart.boxY + dragStart.boxH;
            nextW = Math.min(maxW, maxH * aspect, nextW);
            nextH = nextW / aspect;
            nextY = dragStart.boxY + dragStart.boxH - nextH;
            break;
          }
          case 'tl': {
            nextX = Math.max(0, Math.min(dragStart.boxX + dragStart.boxW - minSize, dragStart.boxX + dx));
            nextW = dragStart.boxX + dragStart.boxW - nextX;
            const maxW = dragStart.boxX + dragStart.boxW;
            const maxH = dragStart.boxY + dragStart.boxH;
            nextW = Math.min(maxW, maxH * aspect, nextW);
            nextX = dragStart.boxX + dragStart.boxW - nextW;
            nextH = nextW / aspect;
            nextY = dragStart.boxY + dragStart.boxH - nextH;
            break;
          }
          case 'tc': {
            const centerX = dragStart.boxX + dragStart.boxW / 2;
            const maxW = Math.min(centerX, 1 - centerX) * 2;
            const maxH = Math.min(dragStart.boxY + dragStart.boxH, maxW / aspect);
            let targetY = Math.max(0, Math.min(dragStart.boxY + dragStart.boxH - minSize, dragStart.boxY + dy));
            nextH = Math.max(minSize, Math.min(maxH, dragStart.boxY + dragStart.boxH - targetY));
            nextY = dragStart.boxY + dragStart.boxH - nextH;
            nextW = nextH * aspect;
            nextX = centerX - nextW / 2;
            break;
          }
          case 'bc': {
            const centerX = dragStart.boxX + dragStart.boxW / 2;
            const maxW = Math.min(centerX, 1 - centerX) * 2;
            const maxH = Math.min(1 - dragStart.boxY, maxW / aspect);
            nextH = Math.max(minSize, Math.min(maxH, dragStart.boxH + dy));
            nextW = nextH * aspect;
            nextX = centerX - nextW / 2;
            nextY = dragStart.boxY;
            break;
          }
          case 'lc': {
            const centerY = dragStart.boxY + dragStart.boxH / 2;
            const maxH = Math.min(centerY, 1 - centerY) * 2;
            const maxW = Math.min(dragStart.boxX + dragStart.boxW, maxH * aspect);
            let targetX = Math.max(0, Math.min(dragStart.boxX + dragStart.boxW - minSize, dragStart.boxX + dx));
            nextW = Math.max(minSize, Math.min(maxW, dragStart.boxX + dragStart.boxW - targetX));
            nextX = dragStart.boxX + dragStart.boxW - nextW;
            nextH = nextW / aspect;
            nextY = centerY - nextH / 2;
            break;
          }
          case 'rc': {
            const centerY = dragStart.boxY + dragStart.boxH / 2;
            const maxH = Math.min(centerY, 1 - centerY) * 2;
            const maxW = Math.min(1 - dragStart.boxX, maxH * aspect);
            nextW = Math.max(minSize, Math.min(maxW, dragStart.boxW + dx));
            nextH = nextW / aspect;
            nextY = centerY - nextH / 2;
            nextX = dragStart.boxX;
            break;
          }
        }
      } else {
        switch (activeHandle) {
          case 'center':
            nextX = Math.max(0, Math.min(1 - dragStart.boxW, dragStart.boxX + dx));
            nextY = Math.max(0, Math.min(1 - dragStart.boxH, dragStart.boxY + dy));
            break;
          case 'tl':
            nextX = Math.max(0, Math.min(dragStart.boxX + dragStart.boxW - minSize, dragStart.boxX + dx));
            nextY = Math.max(0, Math.min(dragStart.boxY + dragStart.boxH - minSize, dragStart.boxY + dy));
            nextW = dragStart.boxX + dragStart.boxW - nextX;
            nextH = dragStart.boxY + dragStart.boxH - nextY;
            break;
          case 'tr':
            nextW = Math.max(minSize, Math.min(1 - dragStart.boxX, dragStart.boxW + dx));
            nextY = Math.max(0, Math.min(dragStart.boxY + dragStart.boxH - minSize, dragStart.boxY + dy));
            nextH = dragStart.boxY + dragStart.boxH - nextY;
            break;
          case 'bl':
            nextX = Math.max(0, Math.min(dragStart.boxX + dragStart.boxW - minSize, dragStart.boxX + dx));
            nextW = dragStart.boxX + dragStart.boxW - nextX;
            nextH = Math.max(minSize, Math.min(1 - dragStart.boxY, dragStart.boxH + dy));
            break;
          case 'br':
            nextW = Math.max(minSize, Math.min(1 - dragStart.boxX, dragStart.boxW + dx));
            nextH = Math.max(minSize, Math.min(1 - dragStart.boxY, dragStart.boxH + dy));
            break;
          case 'tc':
            nextY = Math.max(0, Math.min(dragStart.boxY + dragStart.boxH - minSize, dragStart.boxY + dy));
            nextH = dragStart.boxY + dragStart.boxH - nextY;
            break;
          case 'bc':
            nextH = Math.max(minSize, Math.min(1 - dragStart.boxY, dragStart.boxH + dy));
            break;
          case 'lc':
            nextX = Math.max(0, Math.min(dragStart.boxX + dragStart.boxW - minSize, dragStart.boxX + dx));
            nextW = dragStart.boxX + dragStart.boxW - nextX;
            break;
          case 'rc':
            nextW = Math.max(minSize, Math.min(1 - dragStart.boxX, dragStart.boxW + dx));
            break;
        }
      }
    }

    setCropBox({
      x: nextX,
      y: nextY,
      w: nextW,
      h: nextH
    });
  };

  const handleMouseDown = (e) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width / canvasRef.current.width;
    const scaleY = rect.height / canvasRef.current.height;

    const screenImageWidth = renderSize.width * scaleX;
    const screenImageHeight = renderSize.height * scaleY;

    const clickImageX = e.clientX - rect.left - CANVAS_PADDING * scaleX;
    const clickImageY = e.clientY - rect.top - CANVAS_PADDING * scaleY;

    const x = Math.max(0, Math.min(1, clickImageX / screenImageWidth));
    const y = Math.max(0, Math.min(1, clickImageY / screenImageHeight));
    startDrag(e.clientX, e.clientY, x, y);
  };

  const handleMouseMove = (e) => {
    if (!canvasRef.current) return;
    
    if (!activeHandle) {
      const hit = getHitHandle(e.clientX, e.clientY);
      setHoverHandle(hit);
      return;
    }
    moveDrag(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setActiveHandle(null);
    setDragStart(null);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 0 || !canvasRef.current) return;
    const touch = e.touches[0];
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = rect.width / canvasRef.current.width;
    const scaleY = rect.height / canvasRef.current.height;

    const screenImageWidth = renderSize.width * scaleX;
    const screenImageHeight = renderSize.height * scaleY;

    const clickImageX = touch.clientX - rect.left - CANVAS_PADDING * scaleX;
    const clickImageY = touch.clientY - rect.top - CANVAS_PADDING * scaleY;

    const x = Math.max(0, Math.min(1, clickImageX / screenImageWidth));
    const y = Math.max(0, Math.min(1, clickImageY / screenImageHeight));
    startDrag(touch.clientX, touch.clientY, x, y);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 0) return;
    if (activeHandle) {
      e.preventDefault();
    }
    const touch = e.touches[0];
    moveDrag(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    setActiveHandle(null);
    setDragStart(null);
  };

  // External action trigger link
  useEffect(() => {
    onRegisterActions({
      reset: handleReset,
      save: executeCrop
    });
    return () => {
      onRegisterActions(null);
    };
  }, [onRegisterActions, image, cropBox, flipH, flipV, showGrid, naturalSize, file]);

  const handleReset = () => {
    setCropBox({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    setFlipH(false);
    setFlipV(false);
    setAspectRatioType('free');
  };

  const executeCrop = () => {
    if (!image || !file) return;

    const sourceCropCanvas = document.createElement('canvas');
    const sctx = sourceCropCanvas.getContext('2d');
    if (!sctx) return;

    const sx = cropBox.x * naturalSize.width;
    const sy = cropBox.y * naturalSize.height;
    const sw = cropBox.w * naturalSize.width;
    const sh = cropBox.h * naturalSize.height;

    sourceCropCanvas.width = sw;
    sourceCropCanvas.height = sh;

    const helperCanvas = document.createElement('canvas');
    helperCanvas.width = naturalSize.width;
    helperCanvas.height = naturalSize.height;
    const hctx = helperCanvas.getContext('2d');
    if (hctx) {
      if (flipH || flipV) {
        hctx.translate(naturalSize.width / 2, naturalSize.height / 2);
        hctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        hctx.translate(-naturalSize.width / 2, -naturalSize.height / 2);
      }
      hctx.drawImage(image, 0, 0);
    }

    sctx.drawImage(helperCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

    sourceCropCanvas.toBlob((blob) => {
      if (!blob) return;
      const updatedFileObject = new File([blob], file.name, { type: file.type });
      const croppedUrl = URL.createObjectURL(blob);
      onSave(updatedFileObject, croppedUrl, blob.size);
    }, file.type, 1.0);
  };

  return (
    <div className="flex flex-col border border-stone-200/50 dark:border-stone-800/40 rounded-xl overflow-hidden bg-white/40 dark:bg-stone-950/30 backdrop-blur-sm shadow-xs w-full h-full">
      {/* Interactive Drawing Canvas (Full container width) */}
      <div className="w-full bg-[#141211] dark:bg-[#070605] p-5 flex flex-col justify-center items-center min-h-[220px] lg:min-h-[420px] overflow-hidden select-none relative">
        <div 
          ref={containerRef}
          className="w-full h-full flex items-center justify-center relative max-h-[420px]"
        >
          {!isReady && (
            <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3 z-10 bg-[#141211]/90">
              <div className="w-5 h-5 border-2 border-stone-500 border-t-blue-500 rounded-full animate-spin" />
              <span className="font-mono text-[9px] text-stone-500 uppercase tracking-widest">
                Loading Image...
              </span>
            </div>
          )}
          
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`max-w-full max-h-[420px] border border-stone-800 rounded shadow-md touch-none ${currentCursor()}`}
          />
        </div>
      </div>
    </div>
  );
}
