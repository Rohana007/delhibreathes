import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import { applyTranslation } from "../utils/translator/localTranslator";
import { useFeatureFlags } from "../hooks/useFeatureFlags";

export default function LanguageSwitcher() {
  const flags = useFeatureFlags();
  const [lang, setLang] = useState(localStorage.getItem("lang") || "en");
  const [open, setOpen] = useState(false);

  // English and Hindi language options
  const languages = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिन्दी" }
  ];

  useEffect(() => {
    applyTranslation(lang);
  }, [lang]);

  const selectLang = (code) => {
    setLang(code);
    localStorage.setItem("lang", code);
    applyTranslation(code);
    setOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (open && !event.target.closest('.lang-switcher')) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [open]);

  return (
    <div className={`lang-switcher ${!flags.showLanguage ? 'hidden-feature' : ''}`}>
      <button
        onClick={() => setOpen(!open)}
        className="lang-btn"
        title="Select Language"
        data-translate="Select Language"
      >
        <Globe size={18} />
        <span>{languages.find(l => l.code === lang)?.label || "English"}</span>
      </button>

      {open && (
        <div className="lang-dropdown">
          {languages.map((l) => (
            <div
              key={l.code}
              className="lang-option"
              onClick={() => selectLang(l.code)}
            >
              {l.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
