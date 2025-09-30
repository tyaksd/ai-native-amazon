'use client';

export default function ContactButton() {
  const handleContactClick = () => {
    // まずmailtoリンクを試す
    const mailtoLink = 'mailto:jack@godship.io';
    window.location.href = mailtoLink;
    
    // フォールバック: クリップボードにコピー（通知なし）
    setTimeout(() => {
      navigator.clipboard.writeText('jack@godship.io').catch(() => {
        // エラーが発生しても何もしない
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
