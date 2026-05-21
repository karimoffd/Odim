import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HiOutlinePhone, HiOutlineLockClosed, HiChevronDown } from 'react-icons/hi';
import { MdLogin } from 'react-icons/md';
import { FcGoogle } from 'react-icons/fc';
import logoImg from '../assets/logo.svg';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [lang, setLang] = useState('UZ');
  const [isLangOpen, setIsLangOpen] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    navigate('/');
  };

  return (
    <div className="login-container">
      <div className="liquid-blob blob-1"></div>
      <div className="liquid-blob blob-2"></div>
      <div className="liquid-blob blob-3"></div>
      <div className="liquid-blob blob-4"></div>
      <div className="login-card">
        <div className="login-top-row">
          <div className="lang-container-wrapper">
            <button
              className="lang-selector"
              onClick={() => setIsLangOpen(!isLangOpen)}
              type="button"
            >
              {lang} <HiChevronDown size={14} className={isLangOpen ? 'rotate' : ''} />
            </button>
            {isLangOpen && (
              <div className="lang-dropdown">
                {['UZ', 'RU', 'EN'].map((l) => (
                  <button
                    key={l}
                    className={`lang-option ${lang === l ? 'active' : ''}`}
                    onClick={() => {
                      setLang(l);
                      setIsLangOpen(false);
                    }}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="login-icon-circle">
          <MdLogin size={32} color="#1E293B" />
        </div>

        <h1 className="login-title">Tizimga kirish</h1>
        <p className="login-subtitle">
          Akkauntingizga kiring<br />kiring
        </p>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="input-container">
            <HiOutlinePhone className="input-icon" size={20} />
            <input
              type="text"
              className="login-input"
              placeholder="Telefon nomer kiriting"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>

          <div className="input-container">
            <HiOutlineLockClosed className="input-icon" size={20} />
            <input
              type="password"
              className="login-input"
              placeholder="Parolni kiriting"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <a href="/forgot-password" className="forgot-password">
            Forgot password?
          </a>

          <button type="submit" className="submit-btn" onClick={() => navigate('/')}>
            Hozir boshlash
          </button>
        </form>

        <div className="divider-container">
          <div className="divider-line"></div>
          <span className="divider-text">yoki</span>
          <div className="divider-line"></div>
        </div>

        <button className="google-btn">
          <FcGoogle size={20} />
          Log in with google
        </button>

        <p className="signup-text">
          Akkauntingiz yo'qmi? <a href="/signup" className="signup-link">Ro'yxatdan o'ting</a>
        </p>

        <div className="footer-logo-container">
          <img src={logoImg} alt="Odim" className="footer-logo-img" />
        </div>

      </div>
    </div>
  );
}

















































