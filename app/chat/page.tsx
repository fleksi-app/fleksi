'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Nav from '@/lib/nav';

function contienetelefono(texto: string): boolean {
  const patrones = [
    /\b\d{10}\b/,
    /\b\d{3}[\s\-\.]\d{3}[\s\-\.]\d{4}\b/,
    /\b\d{2}[\s\-]\d{4}[\s\-]\d{4}\b/,
    /\(\d{2,3}\)\s?\d{3,4}[\s\-]\d{4}/,
    /\+52\s?\d{10}/,
    /whatsapp/i,
    /wsp/i,
    /wa\.me/i,
  ];
  return patrones.some(p => p.test(texto));
}

function FondoFlekser() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg"
      style={{opacity:0.12}} viewBox="0 0 380 700" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(20,40) rotate(-30)">
        <rect x="0" y="3" width="28" height="6" rx="3" fill="#7C3AED"/>
        <circle cx="4" cy="6" r="6" fill="none" stroke="#7C3AED" strokeWidth="3"/>
        <circle cx="24" cy="6" r="4" fill="none" stroke="#7C3AED" strokeWidth="2.5"/>
      </g>
      <g transform="translate(80,20)">
        <rect x="8" y="0" width="3" height="30" rx="1.5" fill="#2563EB"/>
        <path d="M2,30 Q9.5,35 17,30 L14,50 Q9.5,52 5,50 Z" fill="#2563EB"/>
      </g>
      <g transform="translate(150,50) rotate(20)">
        <rect x="5" y="0" width="4" height="20" rx="2" fill="#7C3AED"/>
        <path d="M3,20 Q7,28 11,20 L10,26 Q7,29 4,26 Z" fill="#2563EB"/>
      </g>
      <g transform="translate(220,30)">
        <rect x="0" y="8" width="35" height="16" rx="3" fill="#7C3AED"/>
        <rect x="25" y="4" width="10" height="12" rx="2" fill="#2563EB"/>
        <circle cx="8" cy="25" r="4" fill="#7C3AED"/>
        <circle cx="27" cy="25" r="4" fill="#7C3AED"/>
      </g>
      <g transform="translate(30,120) rotate(45)">
        <rect x="6" y="0" width="4" height="22" rx="2" fill="#2563EB"/>
        <rect x="0" y="0" width="16" height="8" rx="2" fill="#7C3AED"/>
      </g>
      <g transform="translate(100,100) rotate(-15)">
        <rect x="7" y="0" width="3" height="28" rx="1.5" fill="#7C3AED"/>
        <path d="M0,28 L14,28 L11,38 L3,38 Z" fill="#2563EB"/>
      </g>
      <g transform="translate(180,110) rotate(20)">
        <rect x="4" y="0" width="4" height="24" rx="2" fill="#2563EB"/>
        <ellipse cx="6" cy="4" rx="6" ry="4" fill="none" stroke="#7C3AED" strokeWidth="2.5"/>
        <ellipse cx="6" cy="22" rx="5" ry="3" fill="none" stroke="#7C3AED" strokeWidth="2"/>
      </g>
      <g transform="translate(250,105)">
        <rect x="0" y="10" width="38" height="12" rx="4" fill="#7C3AED"/>
        <path d="M6,10 Q10,2 28,2 Q34,2 36,10 Z" fill="#2563EB"/>
        <circle cx="8" cy="23" r="4" fill="#7C3AED"/>
        <circle cx="30" cy="23" r="4" fill="#7C3AED"/>
      </g>
      <g transform="translate(55,200) rotate(-20)">
        <line x1="8" y1="0" x2="0" y2="20" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/>
        <line x1="8" y1="0" x2="16" y2="20" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="8" cy="0" r="3" fill="#7C3AED"/>
      </g>
      <g transform="translate(140,190)">
        <path d="M4,0 L16,0 L14,18 L6,18 Z" fill="#2563EB"/>
        <path d="M4,0 Q10,-5 16,0" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      <g transform="translate(210,185) rotate(35)">
        <rect x="5" y="0" width="4" height="24" rx="2" fill="#7C3AED"/>
        <rect x="3" y="22" width="8" height="5" rx="1" fill="#2563EB"/>
        <rect x="6" y="27" width="2" height="6" rx="1" fill="#7C3AED"/>
      </g>
      <g transform="translate(270,180) rotate(-10)">
        <rect x="8" y="0" width="3" height="20" rx="1.5" fill="#2563EB"/>
        <rect x="0" y="4" width="18" height="10" rx="3" fill="#7C3AED"/>
        <rect x="13" y="8" width="3" height="16" rx="1.5" fill="#2563EB"/>
      </g>
      <g transform="translate(20,280) rotate(15)">
        <rect x="6" y="0" width="4" height="22" rx="2" fill="#7C3AED"/>
        <path d="M2,22 Q8,30 14,22 L12,28 Q8,31 4,28 Z" fill="#2563EB"/>
      </g>
      <g transform="translate(100,270)">
        <rect x="2" y="0" width="6" height="12" rx="3" fill="#7C3AED"/>
        <rect x="10" y="2" width="6" height="10" rx="3" fill="#2563EB"/>
        <rect x="18" y="1" width="6" height="11" rx="3" fill="#7C3AED"/>
      </g>
      <g transform="translate(180,265)">
        <rect x="0" y="4" width="24" height="18" rx="2" fill="#2563EB"/>
        <rect x="0" y="4" width="24" height="5" rx="2" fill="#7C3AED"/>
        <line x1="12" y1="4" x2="12" y2="22" stroke="white" strokeWidth="1.5"/>
        <line x1="0" y1="11" x2="24" y2="11" stroke="white" strokeWidth="1"/>
      </g>
      <g transform="translate(255,260) rotate(-20)">
        <circle cx="12" cy="12" r="10" fill="none" stroke="#7C3AED" strokeWidth="3"/>
        <rect x="22" y="10" width="14" height="4" rx="2" fill="#2563EB"/>
      </g>
      <g transform="translate(20,380) rotate(-30)">
        <rect x="0" y="3" width="28" height="6" rx="3" fill="#7C3AED"/>
        <circle cx="4" cy="6" r="6" fill="none" stroke="#7C3AED" strokeWidth="3"/>
      </g>
      <g transform="translate(100,370)">
        <rect x="8" y="0" width="3" height="30" rx="1.5" fill="#2563EB"/>
        <path d="M2,30 Q9.5,35 17,30 L14,50 Q9.5,52 5,50 Z" fill="#2563EB"/>
      </g>
      <g transform="translate(200,375) rotate(20)">
        <rect x="5" y="0" width="4" height="20" rx="2" fill="#7C3AED"/>
        <path d="M3,20 Q7,28 11,20 L10,26 Q7,29 4,26 Z" fill="#2563EB"/>
      </g>
      <g transform="translate(270,365)">
        <rect x="0" y="8" width="35" height="16" rx="3" fill="#7C3AED"/>
        <rect x="25" y="4" width="10" height="12" rx="2" fill="#2563EB"/>
        <circle cx="8" cy="25" r="4" fill="#7C3AED"/>
        <circle cx="27" cy="25" r="4" fill="#7C3AED"/>
      </g>
      <g transform="translate(50,460) rotate(45)">
        <rect x="6" y="0" width="4" height="22" rx="2" fill="#2563EB"/>
        <rect x="0" y="0" width="16" height="8" rx="2" fill="#7C3AED"/>
      </g>
      <g transform="translate(150,450) rotate(-15)">
        <rect x="7" y="0" width="3" height="28" rx="1.5" fill="#7C3AED"/>
        <path d="M0,28 L14,28 L11,38 L3,38 Z" fill="#2563EB"/>
      </g>
      <g transform="translate(240,455)">
        <rect x="0" y="10" width="38" height="12" rx="4" fill="#7C3AED"/>
        <path d="M6,10 Q10,2 28,2 Q34,2 36,10 Z" fill="#2563EB"/>
        <circle cx="8" cy="23" r="4" fill="#7C3AED"/>
        <circle cx="30" cy="23" r="4" fill="#7C3AED"/>
      </g>
      <g transform="translate(30,550) rotate(-20)">
        <line x1="8" y1="0" x2="0" y2="20" stroke="#2563EB" strokeWidth="3" strokeLinecap="round"/>
        <line x1="8" y1="0" x2="16" y2="20" stroke="#7C3AED" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="8" cy="0" r="3" fill="#7C3AED"/>
      </g>
      <g transform="translate(120,540)">
        <rect x="2" y="0" width="6" height="12" rx="3" fill="#7C3AED"/>
        <rect x="10" y="2" width="6" height="10" rx="3" fill="#2563EB"/>
        <rect x="18" y="1" width="6" height="11" rx="3" fill="#7C3AED"/>
      </g>
      <g transform="translate(200,545) rotate(-10)">
        <rect x="8" y="0" width="3" height="20" rx="1.5" fill="#2563EB"/>
        <rect x="0" y="4" width="18" height="10" rx="3" fill="#7C3AED"/>
        <rect x="13" y="8" width="3" height="16" rx="1.5" fill="#2563EB"/>
      </g>
      <g transform="translate(265,535) rotate(35)">
        <rect x="5" y="0" width="4" height="24" rx="2" fill="#7C3AED"/>
        <rect x="3" y="22" width="8" height="5" rx="1" fill="#2563EB"/>
      </g>
      <g transform="translate(20,640) rotate(-30)">
        <rect x="0" y="3" width="28" height="6" rx="3" fill="#7C3AED"/>
        <circle cx="4" cy="6" r="6" fill="none" stroke="#7C3AED" strokeWidth="3"/>
      </g>
      <g transform="translate(100,630)">
        <rect x="8" y="0" width="3" height="30" rx="1.5" fill="#2563EB"/>
        <path d="M2,30 Q9.5,35 17,30 L14,50 Q9.5,52 5,50 Z" fill="#2563EB"/>
      </g>
      <g transform="translate(180,635)">
        <rect x="0" y="8" width="35" height="16" rx="3" fill="#7C3AED"/>
        <path d="M6,10 Q10,2 28,2 Q34,2 36,10 Z" fill="#2563EB"/>
        <circle cx="8" cy="23" r="4" fill="#7C3AED"/>
        <circle cx="27" cy="23" r="4" fill="#7C3AED"/>
      </g>
      <g transform="translate(260,625) rotate(20)">
        <rect x="5" y="0" width="4" height="20" rx="2" fill="#7C3AED"/>
        <path d="M3,20 Q7,28 11,20 L10,26 Q7,29 4,26 Z" fill="#2563EB"/>
      </g>
    </svg>
  );
}

function FondoEmpresa() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg"
      style={{opacity:0.12}} viewBox="0 0 380 700" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(15,20)">
        <rect x="0" y="0" width="28" height="50" rx="2" fill="#1e3a8a"/>
        {[0,1,2,3].map(i=>[0,1,2].map(j=>(
          <rect key={`${i}-${j}`} x={3+j*8} y={4+i*11} width="5" height="7" rx="1" fill="#334155"/>
        )))}
      </g>
      <g transform="translate(60,35)">
        <rect x="0" y="0" width="20" height="35" rx="2" fill="#334155"/>
        {[0,1,2].map(i=>[0,1].map(j=>(
          <rect key={`${i}-${j}`} x={3+j*9} y={4+i*10} width="5" height="6" rx="1" fill="#1e3a8a"/>
        )))}
      </g>
      <g transform="translate(110,25) rotate(30)">
        <path d="M6,0 Q12,8 8,20 L4,20 Q0,8 6,0 Z" fill="#1e3a8a"/>
        <rect x="4" y="20" width="4" height="8" rx="1" fill="#334155"/>
      </g>
      <g transform="translate(170,20)">
        <ellipse cx="20" cy="5" rx="20" ry="4" fill="none" stroke="#1e3a8a" strokeWidth="2.5"/>
        <rect x="18" y="5" width="4" height="12" rx="2" fill="#334155"/>
        <ellipse cx="20" cy="17" rx="8" ry="2" fill="#1e3a8a"/>
      </g>
      <g transform="translate(230,15)">
        <rect x="0" y="0" width="4" height="28" rx="2" fill="#334155"/>
        <ellipse cx="2" cy="4" rx="4" ry="6" fill="none" stroke="#1e3a8a" strokeWidth="2"/>
        <rect x="10" y="0" width="3" height="28" rx="1.5" fill="#1e3a8a"/>
        <path d="M9,0 Q9,8 12,10 Q15,8 15,0" fill="#334155"/>
        <rect x="20" y="0" width="4" height="10" rx="2" fill="#1e3a8a"/>
        <path d="M20,10 Q22,18 22,28" stroke="#334155" strokeWidth="3" strokeLinecap="round" fill="none"/>
      </g>
      <g transform="translate(280,25)">
        <rect x="0" y="6" width="28" height="20" rx="3" fill="#1e3a8a"/>
        <rect x="8" y="0" width="12" height="8" rx="2" fill="none" stroke="#334155" strokeWidth="2.5"/>
        <line x1="0" y1="14" x2="28" y2="14" stroke="#334155" strokeWidth="1.5"/>
      </g>
      <g transform="translate(30,110) rotate(-25)">
        <rect x="4" y="0" width="6" height="26" rx="1" fill="#334155"/>
        <polygon points="4,26 10,26 7,34" fill="#1e3a8a"/>
        <rect x="4" y="0" width="6" height="5" rx="1" fill="#1e3a8a"/>
      </g>
      <g transform="translate(90,95)">
        <rect x="0" y="10" width="22" height="40" rx="2" fill="#334155"/>
        {[0,1,2].map(i=>[0,1].map(j=>(
          <rect key={`${i}-${j}`} x={2+j*10} y={14+i*11} width="6" height="7" rx="1" fill="#1e3a8a"/>
        )))}
        <rect x="10" y="0" width="2" height="12" rx="1" fill="#1e3a8a"/>
        <circle cx="11" cy="0" r="2" fill="#334155"/>
      </g>
      <g transform="translate(160,100)">
        <rect x="5" y="0" width="14" height="12" rx="3" fill="#1e3a8a"/>
        <rect x="9" y="12" width="6" height="10" rx="2" fill="#334155"/>
        <rect x="3" y="20" width="18" height="3" rx="1.5" fill="#1e3a8a"/>
        <rect x="9" y="23" width="3" height="6" rx="1.5" fill="#334155"/>
        <rect x="4" y="29" width="16" height="2" rx="1" fill="#1e3a8a"/>
      </g>
      <g transform="translate(225,95)">
        <rect x="0" y="0" width="30" height="20" rx="3" fill="#334155"/>
        <rect x="2" y="2" width="26" height="16" rx="2" fill="#1e3a8a"/>
        <rect x="10" y="20" width="10" height="4" rx="1" fill="#334155"/>
        <rect x="6" y="24" width="18" height="2" rx="1" fill="#1e3a8a"/>
      </g>
      <g transform="translate(280,100) rotate(5)">
        <rect x="0" y="0" width="20" height="26" rx="2" fill="#1e3a8a"/>
        <rect x="3" y="5" width="14" height="2" rx="1" fill="#334155"/>
        <rect x="3" y="10" width="14" height="2" rx="1" fill="#334155"/>
        <rect x="3" y="15" width="10" height="2" rx="1" fill="#334155"/>
        <rect x="3" y="20" width="12" height="2" rx="1" fill="#334155"/>
      </g>
      <g transform="translate(20,210)">
        <path d="M2,0 L18,0 L16,20 L4,20 Z" fill="#334155"/>
        <path d="M18,5 Q26,5 26,12 Q26,18 18,16" fill="none" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="10" cy="0" rx="8" ry="2" fill="#1e3a8a"/>
      </g>
      <g transform="translate(80,200)">
        <circle cx="10" cy="4" r="5" fill="#1e3a8a"/>
        <rect x="6" y="9" width="8" height="14" rx="2" fill="#334155"/>
        <line x1="4" y1="12" x2="0" y2="22" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="16" y1="12" x2="20" y2="8" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="22" cy="7" rx="6" ry="2" fill="none" stroke="#334155" strokeWidth="2"/>
        <line x1="10" y1="23" x2="7" y2="34" stroke="#334155" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="23" x2="13" y2="34" stroke="#334155" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      <g transform="translate(160,205)">
        <rect x="0" y="14" width="6" height="14" rx="1" fill="#1e3a8a"/>
        <rect x="8" y="8" width="6" height="20" rx="1" fill="#334155"/>
        <rect x="16" y="2" width="6" height="26" rx="1" fill="#1e3a8a"/>
        <line x1="0" y1="28" x2="22" y2="28" stroke="#334155" strokeWidth="1.5"/>
      </g>
      <g transform="translate(220,200)">
        <rect x="0" y="5" width="16" height="24" rx="2" fill="#334155"/>
        <rect x="6" y="0" width="4" height="6" rx="1" fill="#1e3a8a"/>
        {[0,1].map(i=>[0,1].map(j=>(
          <rect key={`${i}-${j}`} x={2+j*8} y={8+i*9} width="4" height="5" rx="1" fill="#1e3a8a"/>
        )))}
      </g>
      <g transform="translate(270,205)">
        <circle cx="14" cy="14" r="13" fill="none" stroke="#1e3a8a" strokeWidth="2.5"/>
        <line x1="14" y1="14" x2="14" y2="5" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="14" x2="20" y2="18" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round"/>
      </g>
      <g transform="translate(15,340)">
        <rect x="0" y="0" width="28" height="50" rx="2" fill="#1e3a8a"/>
        {[0,1,2,3].map(i=>[0,1,2].map(j=>(
          <rect key={`${i}-${j}`} x={3+j*8} y={4+i*11} width="5" height="7" rx="1" fill="#334155"/>
        )))}
      </g>
      <g transform="translate(90,350)">
        <rect x="0" y="6" width="28" height="20" rx="3" fill="#1e3a8a"/>
        <rect x="8" y="0" width="12" height="8" rx="2" fill="none" stroke="#334155" strokeWidth="2.5"/>
        <line x1="0" y1="14" x2="28" y2="14" stroke="#334155" strokeWidth="1.5"/>
      </g>
      <g transform="translate(170,345) rotate(30)">
        <path d="M6,0 Q12,8 8,20 L4,20 Q0,8 6,0 Z" fill="#1e3a8a"/>
        <rect x="4" y="20" width="4" height="8" rx="1" fill="#334155"/>
      </g>
      <g transform="translate(230,340)">
        <ellipse cx="20" cy="5" rx="20" ry="4" fill="none" stroke="#1e3a8a" strokeWidth="2.5"/>
        <rect x="18" y="5" width="4" height="12" rx="2" fill="#334155"/>
        <ellipse cx="20" cy="17" rx="8" ry="2" fill="#1e3a8a"/>
      </g>
      <g transform="translate(30,440)">
        <rect x="0" y="0" width="4" height="28" rx="2" fill="#334155"/>
        <ellipse cx="2" cy="4" rx="4" ry="6" fill="none" stroke="#1e3a8a" strokeWidth="2"/>
        <rect x="10" y="0" width="3" height="28" rx="1.5" fill="#1e3a8a"/>
        <path d="M9,0 Q9,8 12,10 Q15,8 15,0" fill="#334155"/>
      </g>
      <g transform="translate(140,435)">
        <rect x="5" y="0" width="14" height="12" rx="3" fill="#1e3a8a"/>
        <rect x="9" y="12" width="6" height="10" rx="2" fill="#334155"/>
        <rect x="3" y="20" width="18" height="3" rx="1.5" fill="#1e3a8a"/>
      </g>
      <g transform="translate(220,440) rotate(5)">
        <rect x="0" y="0" width="20" height="26" rx="2" fill="#1e3a8a"/>
        <rect x="3" y="5" width="14" height="2" rx="1" fill="#334155"/>
        <rect x="3" y="10" width="14" height="2" rx="1" fill="#334155"/>
        <rect x="3" y="15" width="10" height="2" rx="1" fill="#334155"/>
      </g>
      <g transform="translate(270,435)">
        <circle cx="14" cy="14" r="13" fill="none" stroke="#1e3a8a" strokeWidth="2.5"/>
        <line x1="14" y1="14" x2="14" y2="5" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="14" x2="20" y2="18" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round"/>
      </g>
      <g transform="translate(15,560)">
        <rect x="0" y="0" width="28" height="50" rx="2" fill="#1e3a8a"/>
        {[0,1,2,3].map(i=>[0,1,2].map(j=>(
          <rect key={`${i}-${j}`} x={3+j*8} y={4+i*11} width="5" height="7" rx="1" fill="#334155"/>
        )))}
      </g>
      <g transform="translate(90,570)">
        <rect x="0" y="6" width="28" height="20" rx="3" fill="#1e3a8a"/>
        <rect x="8" y="0" width="12" height="8" rx="2" fill="none" stroke="#334155" strokeWidth="2.5"/>
        <line x1="0" y1="14" x2="28" y2="14" stroke="#334155" strokeWidth="1.5"/>
      </g>
      <g transform="translate(170,565) rotate(-25)">
        <rect x="4" y="0" width="6" height="26" rx="1" fill="#334155"/>
        <polygon points="4,26 10,26 7,34" fill="#1e3a8a"/>
      </g>
      <g transform="translate(230,560)">
        <ellipse cx="20" cy="5" rx="20" ry="4" fill="none" stroke="#1e3a8a" strokeWidth="2.5"/>
        <rect x="18" y="5" width="4" height="12" rx="2" fill="#334155"/>
        <ellipse cx="20" cy="17" rx="8" ry="2" fill="#1e3a8a"/>
      </g>
      <g transform="translate(280,565)">
        <circle cx="14" cy="14" r="13" fill="none" stroke="#1e3a8a" strokeWidth="2.5"/>
        <line x1="14" y1="14" x2="14" y2="5" stroke="#334155" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14" y1="14" x2="20" y2="18" stroke="#1e3a8a" strokeWidth="2" strokeLinecap="round"/>
      </g>
      <g transform="translate(80,660)">
        <circle cx="10" cy="4" r="5" fill="#1e3a8a"/>
        <rect x="6" y="9" width="8" height="14" rx="2" fill="#334155"/>
        <line x1="4" y1="12" x2="0" y2="22" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="16" y1="12" x2="20" y2="8" stroke="#1e3a8a" strokeWidth="2.5" strokeLinecap="round"/>
        <ellipse cx="22" cy="7" rx="6" ry="2" fill="none" stroke="#334155" strokeWidth="2"/>
        <line x1="10" y1="23" x2="7" y2="34" stroke="#334155" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="23" x2="13" y2="34" stroke="#334155" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      <g transform="translate(160,655)">
        <rect x="0" y="14" width="6" height="14" rx="1" fill="#1e3a8a"/>
        <rect x="8" y="8" width="6" height="20" rx="1" fill="#334155"/>
        <rect x="16" y="2" width="6" height="26" rx="1" fill="#1e3a8a"/>
        <line x1="0" y1="28" x2="22" y2="28" stroke="#334155" strokeWidth="1.5"/>
      </g>
      <g transform="translate(225,650)">
        <rect x="0" y="0" width="30" height="20" rx="3" fill="#334155"/>
        <rect x="2" y="2" width="26" height="16" rx="2" fill="#1e3a8a"/>
        <rect x="10" y="20" width="10" height="4" rx="1" fill="#334155"/>
      </g>
    </svg>
  );
}

function FondoViajero() {
  return (
    <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg"
      style={{opacity:0.12}} viewBox="0 0 380 700" preserveAspectRatio="xMidYMid slice">
      <g transform="translate(20,30) rotate(-15)">
        <ellipse cx="20" cy="8" rx="20" ry="6" fill="#0369a1"/>
        <polygon points="40,8 52,4 52,12" fill="#0e7490"/>
        <rect x="8" y="2" width="16" height="6" rx="3" fill="#0e7490"/>
        <rect x="12" y="12" width="8" height="4" rx="2" fill="#0369a1"/>
      </g>
      <g transform="translate(75,15)">
        <rect x="7" y="20" width="5" height="30" rx="2.5" fill="#0e7490"/>
        <path d="M9,20 Q0,10 -8,15 Q-2,8 9,14" fill="#0369a1"/>
        <path d="M9,20 Q18,8 26,12 Q20,6 9,14" fill="#0369a1"/>
        <path d="M9,20 Q4,5 8,0 Q10,6 10,14" fill="#0e7490"/>
      </g>
      <g transform="translate(140,20)">
        <rect x="0" y="6" width="26" height="20" rx="4" fill="#0369a1"/>
        <rect x="7" y="0" width="12" height="8" rx="2" fill="none" stroke="#0e7490" strokeWidth="2.5"/>
        <line x1="13" y1="6" x2="13" y2="26" stroke="#0e7490" strokeWidth="1.5"/>
        <line x1="0" y1="14" x2="26" y2="14" stroke="#0e7490" strokeWidth="1"/>
      </g>
      <g transform="translate(200,15)">
        <rect x="8" y="0" width="4" height="28" rx="2" fill="#0e7490"/>
        <rect x="0" y="4" width="20" height="14" rx="2" fill="#0369a1"/>
        <polygon points="20,4 28,11 20,18" fill="#0369a1"/>
      </g>
      <g transform="translate(255,25)">
        <path d="M2,12 Q15,20 28,12 L24,18 Q15,22 6,18 Z" fill="#0369a1"/>
        <rect x="10" y="4" width="4" height="10" rx="2" fill="#0e7490"/>
        <polygon points="14,4 14,12 22,8" fill="#0369a1"/>
      </g>
      <g transform="translate(20,120)">
        <circle cx="8" cy="8" r="8" fill="none" stroke="#0369a1" strokeWidth="2.5"/>
        <circle cx="26" cy="8" r="8" fill="none" stroke="#0369a1" strokeWidth="2.5"/>
        <line x1="16" y1="8" x2="18" y2="8" stroke="#0e7490" strokeWidth="2"/>
        <ellipse cx="8" cy="8" rx="5" ry="5" fill="#0e7490" fillOpacity="0.3"/>
        <ellipse cx="26" cy="8" rx="5" ry="5" fill="#0e7490" fillOpacity="0.3"/>
      </g>
      <g transform="translate(90,105)">
        <rect x="8" y="30" width="5" height="12" rx="2" fill="#0e7490"/>
        <polygon points="10,0 0,16 20,16" fill="#0369a1"/>
        <polygon points="10,8 -2,26 22,26" fill="#0e7490"/>
      </g>
      <g transform="translate(155,110)">
        <circle cx="14" cy="14" r="13" fill="none" stroke="#0369a1" strokeWidth="2.5"/>
        <polygon points="14,4 11,14 14,12 17,14" fill="#0e7490"/>
        <polygon points="14,24 11,14 14,16 17,14" fill="#0369a1"/>
        <circle cx="14" cy="14" r="2" fill="#0369a1"/>
      </g>
      <g transform="translate(210,108)">
        <rect x="0" y="0" width="36" height="22" rx="2" fill="#0369a1"/>
        <line x1="18" y1="0" x2="18" y2="22" stroke="white" strokeWidth="2" strokeDasharray="4,3"/>
        <line x1="0" y1="0" x2="36" y2="0" stroke="#0e7490" strokeWidth="1.5"/>
        <line x1="0" y1="22" x2="36" y2="22" stroke="#0e7490" strokeWidth="1.5"/>
      </g>
      <g transform="translate(275,110)">
        <rect x="0" y="4" width="28" height="20" rx="4" fill="#0369a1"/>
        <rect x="8" y="0" width="12" height="6" rx="2" fill="#0e7490"/>
        <circle cx="14" cy="14" r="6" fill="none" stroke="#0e7490" strokeWidth="2.5"/>
        <circle cx="14" cy="14" r="3" fill="#0369a1"/>
      </g>
      <g transform="translate(30,220)">
        <rect x="5" y="16" width="4" height="22" rx="2" fill="#0e7490"/>
        <path d="M7,16 Q0,8 -6,12 Q-1,6 7,12" fill="#0369a1"/>
        <path d="M7,16 Q14,6 20,10 Q15,4 7,12" fill="#0369a1"/>
      </g>
      <g transform="translate(85,215)">
        <rect x="2" y="4" width="20" height="24" rx="4" fill="#0369a1"/>
        <rect x="6" y="0" width="12" height="6" rx="3" fill="#0e7490"/>
        <rect x="6" y="14" width="12" height="8" rx="2" fill="#0e7490"/>
        <line x1="12" y1="14" x2="12" y2="22" stroke="#0369a1" strokeWidth="1.5"/>
      </g>
      <g transform="translate(155,215)">
        <circle cx="14" cy="14" r="9" fill="#0369a1"/>
        {[0,45,90,135,180,225,270,315].map((deg,i)=>(
          <line key={i}
            x1={14+11*Math.cos(deg*Math.PI/180)} y1={14+11*Math.sin(deg*Math.PI/180)}
            x2={14+15*Math.cos(deg*Math.PI/180)} y2={14+15*Math.sin(deg*Math.PI/180)}
            stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round"/>
        ))}
      </g>
      <g transform="translate(215,210)">
        <rect x="8" y="0" width="4" height="22" rx="2" fill="#0e7490"/>
        <polygon points="12,6 20,10 20,20 12,24 4,20 4,10" fill="#0369a1"/>
      </g>
      <g transform="translate(260,215)">
        <path d="M0,10 Q8,2 16,10 Q24,18 32,10" fill="none" stroke="#0369a1" strokeWidth="3" strokeLinecap="round"/>
        <path d="M0,18 Q8,10 16,18 Q24,26 32,18" fill="none" stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      <g transform="translate(20,340) rotate(-15)">
        <ellipse cx="20" cy="8" rx="20" ry="6" fill="#0369a1"/>
        <polygon points="40,8 52,4 52,12" fill="#0e7490"/>
        <rect x="8" y="2" width="16" height="6" rx="3" fill="#0e7490"/>
      </g>
      <g transform="translate(90,330)">
        <rect x="7" y="20" width="5" height="30" rx="2.5" fill="#0e7490"/>
        <path d="M9,20 Q0,10 -8,15 Q-2,8 9,14" fill="#0369a1"/>
        <path d="M9,20 Q18,8 26,12 Q20,6 9,14" fill="#0369a1"/>
      </g>
      <g transform="translate(160,335)">
        <rect x="0" y="6" width="26" height="20" rx="4" fill="#0369a1"/>
        <rect x="7" y="0" width="12" height="8" rx="2" fill="none" stroke="#0e7490" strokeWidth="2.5"/>
        <line x1="13" y1="6" x2="13" y2="26" stroke="#0e7490" strokeWidth="1.5"/>
      </g>
      <g transform="translate(225,325)">
        <circle cx="14" cy="14" r="13" fill="none" stroke="#0369a1" strokeWidth="2.5"/>
        <polygon points="14,4 11,14 14,12 17,14" fill="#0e7490"/>
        <polygon points="14,24 11,14 14,16 17,14" fill="#0369a1"/>
      </g>
      <g transform="translate(30,440)">
        <circle cx="14" cy="14" r="9" fill="#0369a1"/>
        {[0,45,90,135,180,225,270,315].map((deg,i)=>(
          <line key={i}
            x1={14+11*Math.cos(deg*Math.PI/180)} y1={14+11*Math.sin(deg*Math.PI/180)}
            x2={14+15*Math.cos(deg*Math.PI/180)} y2={14+15*Math.sin(deg*Math.PI/180)}
            stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round"/>
        ))}
      </g>
      <g transform="translate(110,425)">
        <rect x="2" y="4" width="20" height="24" rx="4" fill="#0369a1"/>
        <rect x="6" y="0" width="12" height="6" rx="3" fill="#0e7490"/>
        <rect x="6" y="14" width="12" height="8" rx="2" fill="#0e7490"/>
      </g>
      <g transform="translate(195,420) rotate(-15)">
        <ellipse cx="20" cy="8" rx="20" ry="6" fill="#0369a1"/>
        <polygon points="40,8 52,4 52,12" fill="#0e7490"/>
      </g>
      <g transform="translate(270,430)">
        <path d="M0,10 Q8,2 16,10 Q24,18 32,10" fill="none" stroke="#0369a1" strokeWidth="3" strokeLinecap="round"/>
        <path d="M0,18 Q8,10 16,18 Q24,26 32,18" fill="none" stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      <g transform="translate(20,550) rotate(-15)">
        <ellipse cx="20" cy="8" rx="20" ry="6" fill="#0369a1"/>
        <polygon points="40,8 52,4 52,12" fill="#0e7490"/>
        <rect x="8" y="2" width="16" height="6" rx="3" fill="#0e7490"/>
      </g>
      <g transform="translate(90,540)">
        <rect x="8" y="30" width="5" height="12" rx="2" fill="#0e7490"/>
        <polygon points="10,0 0,16 20,16" fill="#0369a1"/>
        <polygon points="10,8 -2,26 22,26" fill="#0e7490"/>
      </g>
      <g transform="translate(160,545)">
        <rect x="0" y="6" width="26" height="20" rx="4" fill="#0369a1"/>
        <rect x="7" y="0" width="12" height="8" rx="2" fill="none" stroke="#0e7490" strokeWidth="2.5"/>
        <line x1="13" y1="6" x2="13" y2="26" stroke="#0e7490" strokeWidth="1.5"/>
      </g>
      <g transform="translate(215,540)">
        <rect x="8" y="0" width="4" height="22" rx="2" fill="#0e7490"/>
        <polygon points="12,6 20,10 20,20 12,24 4,20 4,10" fill="#0369a1"/>
      </g>
      <g transform="translate(260,545)">
        <path d="M0,10 Q8,2 16,10 Q24,18 32,10" fill="none" stroke="#0369a1" strokeWidth="3" strokeLinecap="round"/>
        <path d="M0,18 Q8,10 16,18 Q24,26 32,18" fill="none" stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round"/>
      </g>
      <g transform="translate(30,650)">
        <circle cx="14" cy="14" r="9" fill="#0369a1"/>
        {[0,45,90,135,180,225,270,315].map((deg,i)=>(
          <line key={i}
            x1={14+11*Math.cos(deg*Math.PI/180)} y1={14+11*Math.sin(deg*Math.PI/180)}
            x2={14+15*Math.cos(deg*Math.PI/180)} y2={14+15*Math.sin(deg*Math.PI/180)}
            stroke="#0e7490" strokeWidth="2.5" strokeLinecap="round"/>
        ))}
      </g>
      <g transform="translate(110,645)">
        <rect x="2" y="4" width="20" height="24" rx="4" fill="#0369a1"/>
        <rect x="6" y="0" width="12" height="6" rx="3" fill="#0e7490"/>
        <rect x="6" y="14" width="12" height="8" rx="2" fill="#0e7490"/>
      </g>
      <g transform="translate(195,640) rotate(-15)">
        <ellipse cx="20" cy="8" rx="20" ry="6" fill="#0369a1"/>
        <polygon points="40,8 52,4 52,12" fill="#0e7490"/>
      </g>
      <g transform="translate(270,650)">
        <rect x="0" y="6" width="26" height="20" rx="4" fill="#0369a1"/>
        <rect x="7" y="0" width="12" height="8" rx="2" fill="none" stroke="#0e7490" strokeWidth="2.5"/>
        <line x1="13" y1="6" x2="13" y2="26" stroke="#0e7490" strokeWidth="1.5"/>
      </g>
    </svg>
  );
}

export default function Chat() {
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [conversacionActiva, setConversacionActiva] = useState<any>(null);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [usuario, setUsuario] = useState<any>(null);
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [advertencia, setAdvertencia] = useState('');
  const mensajesEndRef = useRef<HTMLDivElement>(null);
  const canalRef = useRef<any>(null);

  useEffect(() => { cargarDatos(); }, []);
  useEffect(() => { scrollAbajo(); }, [mensajes]);

  useEffect(() => {
    if (!conversacionActiva || !usuario) return;
    if (canalRef.current) supabase.removeChannel(canalRef.current);
    const canal = supabase
      .channel(`chat-${conversacionActiva.servicio_id}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: `servicio_id=eq.${conversacionActiva.servicio_id}`,
      }, (payload) => {
        const msg = payload.new as any;
        setMensajes(prev => {
          if (prev.find(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        scrollAbajo();
      })
      .subscribe();
    canalRef.current = canal;
    return () => { supabase.removeChannel(canal); };
  }, [conversacionActiva, usuario]);

  const scrollAbajo = () => {
    setTimeout(() => { mensajesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const cargarDatos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/login'; return; }
    const { data: perfil } = await supabase.from('usuarios').select('*').eq('id', user.id).single();
    setUsuario({ ...perfil, authId: user.id });
    const { data: msgs } = await supabase
      .from('mensajes')
      .select('*, remitente:remitente_id(id, nombre, foto_url), destinatario:destinatario_id(id, nombre, foto_url), servicios(titulo)')
      .or(`remitente_id.eq.${user.id},destinatario_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    const convMap = new Map();
    msgs?.forEach(m => { if (!convMap.has(m.servicio_id)) convMap.set(m.servicio_id, m); });
    setConversaciones(Array.from(convMap.values()));
    setCargando(false);
  };

  const cargarMensajes = async (conv: any) => {
    setConversacionActiva(conv);
    setAdvertencia('');
    const { data } = await supabase
      .from('mensajes')
      .select('*, remitente:remitente_id(id, nombre, foto_url)')
      .eq('servicio_id', conv.servicio_id)
      .order('created_at', { ascending: true });
    setMensajes(data || []);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('mensajes').update({ leido: true })
      .eq('servicio_id', conv.servicio_id).eq('destinatario_id', user!.id).eq('leido', false);
  };

  const enviarMensaje = async () => {
    if (!nuevoMensaje.trim() || !conversacionActiva || enviando) return;
    if (contienetelefono(nuevoMensaje)) {
      setAdvertencia('🔒 No puedes compartir números de teléfono. Usa Fleksi para coordinar tu trabajo.');
      return;
    }
    setEnviando(true);
    setAdvertencia('');
    const { data: { user } } = await supabase.auth.getUser();
    const destinatario = conversacionActiva.remitente_id === user!.id
      ? conversacionActiva.destinatario_id : conversacionActiva.remitente_id;
    const { data } = await supabase.from('mensajes').insert({
      servicio_id: conversacionActiva.servicio_id,
      remitente_id: user!.id,
      destinatario_id: destinatario,
      contenido: nuevoMensaje.trim(),
    }).select('*, remitente:remitente_id(id, nombre, foto_url)').single();
    if (data) {
      setMensajes(prev => { if (prev.find(m => m.id === data.id)) return prev; return [...prev, data]; });
      setNuevoMensaje('');
      try {
        await supabase.from('notificaciones').insert({
          usuario_id: destinatario, tipo: 'mensaje_nuevo',
          titulo: `💬 Mensaje de ${usuario?.nombre}`,
          mensaje: nuevoMensaje.trim().slice(0, 60), link: '/chat',
        });
      } catch (e) {}
      try {
        const bc = new BroadcastChannel('fleksi-notifs');
        bc.postMessage({ type: 'nueva_notificacion' });
        bc.close();
      } catch (e) {}
    }
    setEnviando(false);
  };

  const getOtroUsuario = (conv: any) => {
    if (!usuario) return null;
    return conv.remitente?.id === usuario.authId ? conv.destinatario : conv.remitente;
  };

  const rol = usuario?.rol_activo || usuario?.rol || 'flekser';
  const esEmpresa = rol === 'empresa';
  const esViajero = rol === 'viajero';

  const headerGradient = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const bubbleGradient = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const focusBorder = esEmpresa ? 'focus:border-blue-700' : esViajero ? 'focus:border-teal-400' : 'focus:border-purple-400';
  const dotColor = esEmpresa ? 'bg-blue-800' : esViajero ? 'bg-teal-500' : 'bg-purple-600';
  const avatarGradient = esEmpresa ? 'from-slate-700 to-blue-900' : esViajero ? 'from-sky-500 to-teal-500' : 'from-blue-600 to-purple-600';
  const bgFondo = esEmpresa ? 'bg-slate-100' : esViajero ? 'bg-sky-100' : 'bg-purple-50';
  const spinnerColor = esEmpresa ? 'border-blue-800' : esViajero ? 'border-teal-500' : 'border-purple-600';
  const Fondo = esEmpresa ? FondoEmpresa : esViajero ? FondoViajero : FondoFlekser;

  if (cargando) {
    return (
      <main className={`min-h-screen ${bgFondo} flex items-center justify-center`}>
        <div className="text-center">
          <div className={`w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4 ${spinnerColor}`}></div>
          <p className="text-gray-400">Cargando mensajes...</p>
        </div>
      </main>
    );
  }

  if (conversacionActiva) {
    const otroUsuario = getOtroUsuario(conversacionActiva);
    return (
      <main className={`min-h-screen ${bgFondo} flex flex-col pb-16 relative`}>
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <Fondo />
        </div>

        <div className="bg-white/95 backdrop-blur-sm px-6 pt-12 pb-4 shadow-sm flex-shrink-0 relative z-10">
          <div className="max-w-md mx-auto flex items-center gap-3">
            <button onClick={() => { setConversacionActiva(null); cargarDatos(); }}
              className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600">←</button>
            <div className="flex-1">
              <h2 className="font-extrabold text-gray-900 text-sm leading-tight">{otroUsuario?.nombre || 'Conversación'}</h2>
              <p className="text-xs text-gray-400">{conversacionActiva.servicios?.titulo}</p>
            </div>
            <div className={`w-10 h-10 bg-gradient-to-r ${avatarGradient} rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden`}>
              {otroUsuario?.foto_url ? <img src={otroUsuario.foto_url} className="w-full h-full object-cover"/> : otroUsuario?.nombre?.charAt(0) || '?'}
            </div>
          </div>
        </div>

        <div className="max-w-md mx-auto w-full px-6 pt-3 relative z-10">
          <div className="bg-amber-50/90 border border-amber-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <span className="text-sm">🔒</span>
            <p className="text-xs text-amber-700 font-medium">Los pagos y contacto se gestionan dentro de Fleksi</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 max-w-md mx-auto w-full relative z-10">
          {mensajes.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-4">💬</p>
              <p className="font-bold text-gray-900 mb-2">Inicia la conversación</p>
              <p className="text-gray-400 text-sm">Escribe un mensaje para comenzar</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {mensajes.map((msg) => {
                const esMio = msg.remitente_id === usuario?.authId;
                return (
                  <div key={msg.id} className={`flex ${esMio ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-4 py-3 rounded-2xl ${
                      esMio
                        ? `bg-gradient-to-r ${bubbleGradient} text-white rounded-br-sm`
                        : 'bg-white/90 backdrop-blur-sm text-gray-900 shadow-sm border border-gray-100 rounded-bl-sm'
                    }`}>
                      <p className="text-sm">{msg.contenido}</p>
                      <p className={`text-xs mt-1 ${esMio ? 'text-white/60' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('es-MX', {hour: '2-digit', minute: '2-digit'})}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={mensajesEndRef}/>
            </div>
          )}
        </div>

        <div className="bg-white/95 backdrop-blur-sm border-t border-gray-200 px-6 py-3 flex-shrink-0 relative z-10">
          <div className="max-w-md mx-auto">
            {advertencia && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-xl mb-2 text-xs font-semibold">{advertencia}</div>
            )}
            <div className="flex gap-3">
              <input type="text" placeholder="Escribe un mensaje..."
                value={nuevoMensaje}
                onChange={(e) => { setNuevoMensaje(e.target.value); if (advertencia) setAdvertencia(''); }}
                onKeyDown={(e) => e.key === 'Enter' && enviarMensaje()}
                className={`flex-1 p-4 rounded-2xl border-2 border-gray-200 ${focusBorder} outline-none transition text-gray-900`}/>
              <button onClick={enviarMensaje} disabled={enviando || !nuevoMensaje.trim()}
                className={`w-14 h-14 bg-gradient-to-r ${bubbleGradient} text-white rounded-2xl font-bold text-xl disabled:opacity-50 transition flex items-center justify-center`}>
                ➤
              </button>
            </div>
          </div>
        </div>

        <Nav activo="chat" />
      </main>
    );
  }

  return (
    <main className={`min-h-screen ${bgFondo} pb-32 relative`}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <Fondo />
      </div>

      <div className={`bg-gradient-to-r ${headerGradient} px-6 pt-12 pb-4 shadow-sm relative z-10`}>
        <div className="max-w-md mx-auto">
          <h1 className="font-extrabold text-white text-xl">Mensajes</h1>
          <p className="text-white/70 text-sm mt-0.5">Coordina tus trabajos de forma segura</p>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 py-4 relative z-10">
        {conversaciones.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-4">💬</p>
            <p className="font-bold text-gray-900 mb-2">Sin mensajes todavía</p>
            <p className="text-gray-400 text-sm mb-6">Cuando apliques a un trabajo o recibas una aplicación, podrás chatear aquí</p>
            <a href="/home" className={`inline-block px-6 py-3 bg-gradient-to-r ${headerGradient} text-white rounded-2xl font-bold text-sm`}>
              Ver trabajos disponibles
            </a>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {conversaciones.map((conv) => {
              const otro = getOtroUsuario(conv);
              const noLeido = !conv.leido && conv.destinatario_id === usuario?.authId;
              return (
                <button key={conv.id} onClick={() => cargarMensajes(conv)}
                  className="bg-white/70 rounded-2xl p-4 shadow-sm border border-white/80 text-left w-full active:scale-95 transition backdrop-blur-sm">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 bg-gradient-to-r ${avatarGradient} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 overflow-hidden`}>
                      {otro?.foto_url ? <img src={otro.foto_url} className="w-full h-full object-cover"/> : otro?.nombre?.charAt(0) || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className={`text-sm ${noLeido ? 'font-extrabold text-gray-900' : 'font-bold text-gray-900'}`}>{otro?.nombre || 'Usuario'}</p>
                        <p className="text-xs text-gray-400">{new Date(conv.created_at).toLocaleDateString('es-MX', {day: '2-digit', month: 'short'})}</p>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{conv.servicios?.titulo}</p>
                      <p className="text-xs text-gray-400 truncate mt-0.5">{conv.contenido}</p>
                    </div>
                    {noLeido && <div className={`w-3 h-3 ${dotColor} rounded-full flex-shrink-0`}/>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <Nav activo="chat" />
    </main>
  );
}