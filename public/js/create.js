document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('shorten-form');
    const urlInput = document.getElementById('url-input');
    const customCodeInput = document.getElementById('custom-code');
    const resultDiv = document.getElementById('result');
  
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const url = urlInput.value.trim();
      const customCode = customCodeInput.value.trim();
      
      if (!url) {
        alert('Please enter a URL');
        return;
      }
  
      try {
        const response = await fetch('/api/create', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ url, customCode })
        });
  
        const data = await response.json();
        
        if (data.error) {
          alert(data.error);
          return;
        }
  
        const fullUrl = `${window.location.origin}/${data.code}`;
        resultDiv.innerHTML = `
          <p>Shortened URL:</p>
          <a href="${fullUrl}" target="_blank">${fullUrl}</a>
          ${data.existing ? '<p>(Existing link)</p>' : ''}
          <button onclick="copyToClipboard('${fullUrl}')">Copy</button>
        `;
      } catch (err) {
        console.error('Error:', err);
        alert('Failed to create short link');
      }
    });
  });
  
  function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
      .then(() => alert('Copied to clipboard!'))
      .catch(err => console.error('Copy failed:', err));
  }