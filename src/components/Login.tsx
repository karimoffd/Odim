import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  TbPhone,
  TbLock,
  TbChevronDown,
  TbLogin,
  TbAlertCircle,
  TbUserPlus,
  TbUser,
  TbId,
  TbEye,
  TbEyeOff,
  TbCheck
} from 'react-icons/tb';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.svg';
import './Login.css';

interface LoginProps {
  defaultMode?: 'login' | 'register';
}

export default function Login({ defaultMode }: LoginProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const isInitialRegister = defaultMode === 'register' || location.pathname === '/register';
  const [mode, setMode] = useState<'login' | 'register'>(isInitialRegister ? 'register' : 'login');

  // Login form state
  const [phoneNumber, setPhoneNumber] = useState('+998 99 858 20 06');
  const [password, setPassword] = useState('admin123');

  // Registration form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [regPhone, setRegPhone] = useState('+998 ');
  const [regPassword, setRegPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState('UZ');
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Phone number auto-formatter for registration
  const handlePhoneChange = (val: string) => {
    let clean = val;
    if (!clean.startsWith('+998')) {
      clean = '+998 ' + clean.replace(/^\+?998\s*/, '');
    }
    setRegPhone(clean);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim() || !password.trim()) {
      setErrorMsg('Iltimos, telefon raqam va parolni kiriting!');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      await login(phoneNumber, password);
      navigate('/');
    } catch (err: any) {
      setErrorMsg(err.message || "Telefon yoki parol noto'g'ri!");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setErrorMsg('Iltimos, ismingizni kiriting!');
      return;
    }
    if (!lastName.trim()) {
      setErrorMsg('Iltimos, familiyangizni kiriting!');
      return;
    }
    if (!regPhone.trim() || regPhone.trim() === '+998') {
      setErrorMsg('Iltimos, telefon raqamingizni kiriting!');
      return;
    }

    const phoneDigits = regPhone.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
      setErrorMsg("Iltimos, to'liq telefon raqamini kiriting (masalan: +998 90 123 45 67)!");
      return;
    }

    if (!regPassword.trim()) {
      setErrorMsg('Iltimos, parol kiriting!');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: regPhone.trim(),
        password: regPassword.trim(),
        roleId: 'cashier'
      });
      setSuccessMsg(`Xush kelibsiz, ${firstName}! Akkauntingiz muvaffaqiyatli yaratildi.`);
      setTimeout(() => {
        navigate('/');
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || "Ro'yxatdan o'tishda xatolik yuz berdi!");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'register') => {
    setMode(newMode);
    setErrorMsg(null);
    setSuccessMsg(null);
  };

  return (
    <div className="login-container">
      <div className="liquid-blob blob-1"></div>
      <div className="liquid-blob blob-2"></div>
      <div className="liquid-blob blob-3"></div>
      <div className="liquid-blob blob-4"></div>
      
      <div className={`login-card ${mode === 'register' ? 'register-card' : ''}`}>
        <div className="login-top-row">
          {/* Mode Switcher Tabs */}
          <div className="auth-tab-switch">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => switchMode('login')}
            >
              <TbLogin size={16} />
              <span>Kirish</span>
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'register' ? 'active' : ''}`}
              onClick={() => switchMode('register')}
            >
              <TbUserPlus size={16} />
              <span>Ro'yxatdan o'tish</span>
            </button>
          </div>

          <div className="lang-container-wrapper">
            <button
              className="lang-selector"
              onClick={() => setIsLangOpen(!isLangOpen)}
              type="button"
            >
              {lang} <TbChevronDown size={14} className={isLangOpen ? 'rotate' : ''} />
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
          {mode === 'login' ? (
            <TbLogin size={30} color="#1e293b" />
          ) : (
            <TbUserPlus size={30} color="#0284c7" />
          )}
        </div>

        <h1 className="login-title">
          {mode === 'login' ? 'Tizimga kirish' : "Ro'yxatdan o'tish"}
        </h1>
        <p className="login-subtitle">
          {mode === 'login'
            ? 'ODIM CRM xodimlar tizimiga kirish'
            : "ODIM tizimida yangi akkaunt yarating va darhol tizimga kiring"}
        </p>

        {errorMsg && (
          <div className="auth-alert error-alert">
            <TbAlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="auth-alert success-alert">
            <TbCheck size={18} style={{ flexShrink: 0 }} />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form className="login-form" onSubmit={handleLogin}>
            <div className="input-container">
              <TbPhone className="input-icon" size={20} />
              <input
                type="text"
                className="login-input"
                placeholder="Telefon raqam yoki login"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="input-container">
              <TbLock className="input-icon" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Parol"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPassword ? <TbEyeOff size={18} /> : <TbEye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-spinner-content">
                  <span className="spin-circle"></span> Tekshirilmoqda...
                </span>
              ) : (
                "Tizimga kirish"
              )}
            </button>

            <p className="auth-switch-text">
              Hisobingiz yo'qmi?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => switchMode('register')}
              >
                Ro'yxatdan o'tish
              </button>
            </p>
          </form>
        ) : (
          <form className="login-form register-form-animate" onSubmit={handleRegister}>
            <div className="input-row-2col">
              <div className="input-container">
                <TbUser className="input-icon" size={20} />
                <input
                  type="text"
                  className="login-input"
                  placeholder="Ismingiz (masalan: Ali)"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="input-container">
                <TbId className="input-icon" size={20} />
                <input
                  type="text"
                  className="login-input"
                  placeholder="Familiyangiz (masalan: Valiyev)"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="input-container">
              <TbPhone className="input-icon" size={20} />
              <input
                type="tel"
                className="login-input"
                placeholder="+998 90 123 45 67"
                value={regPhone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="input-container">
              <TbLock className="input-icon" size={20} />
              <input
                type={showPassword ? 'text' : 'password'}
                className="login-input"
                placeholder="Parol yarating"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                disabled={isLoading}
                required
              />
              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                title={showPassword ? "Parolni yashirish" : "Parolni ko'rsatish"}
              >
                {showPassword ? <TbEyeOff size={18} /> : <TbEye size={18} />}
              </button>
            </div>

            <button
              type="submit"
              className="submit-btn register-submit-btn"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="btn-spinner-content">
                  <span className="spin-circle"></span> Akkaunt yaratilmoqda...
                </span>
              ) : (
                "Ro'yxatdan o'tish va Kirish"
              )}
            </button>

            <p className="auth-switch-text">
              Akkauntingiz allaqachon bormi?{' '}
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => switchMode('login')}
              >
                Tizimga kirish
              </button>
            </p>
          </form>
        )}

        <div className="footer-logo-container">
          <img src={logoImg} alt="Odim" className="footer-logo-img" />
        </div>
      </div>
    </div>
  );
}
