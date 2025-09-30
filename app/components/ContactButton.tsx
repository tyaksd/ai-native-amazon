'use client';

export default function ContactButton() {
  const handleContactClick = () => {
    // まずmailtoリンクを試す
    const mailtoLink = 'mailto:jack@godship.io';
    window.location.href = mailtoLink;
    
    // フォールバック: クリップボードにコピー
    setTimeout(() => {
      navigator.clipboard.writeText('jack@godship.io').then(() => {
        alert('メールアドレスをクリップボードにコピーしました: jack@godship.io');
      }).catch(() => {
        alert('メールアドレス: jack@godship.io');
      });
    }, 1000);
  };

  return (
    <button 
      className="hover:underline text-sm text-white/80 bg-transparent border-none p-0 cursor-pointer"
      onClick={handleContactClick}
    >
      Contact
    </button>
  );
}
