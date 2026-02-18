class BoxEstimator extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.files = [];

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        /* --- General Container --- */
        .container {
          padding: 2rem;
          border: 2px dashed #d0d8ea;
          border-radius: var(--border-radius, 12px);
          background-color: #f7f9fc;
          transition: background-color 0.3s, box-shadow 0.3s;
          box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        .container:hover, .container.dragover {
          background-color: #eff3fa;
          border-color: var(--primary-color, #5E5DF0);
          box-shadow: 0 8px 16px rgba(0,0,0,0.05);
        }
        /* --- Upload Area --- */
        #upload-area { display: block; }
        .upload-label {
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          padding: 2.5rem; cursor: pointer; font-size: 1.1em; color: #555; text-align: center;
        }
        .upload-label svg { width: 50px; height: 50px; margin-bottom: 1rem; color: var(--primary-color, #5E5DF0); }
        .upload-label strong { color: var(--primary-color, #5E5DF0); font-weight: 700; }
        #file-input { display: none; }

        /* --- Preview Grid --- */
        #preview-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem; margin-top: 1.5rem;
        }
        .preview-img {
          width: 100%; height: 100px; object-fit: cover;
          border-radius: 8px; border: 1px solid #eee;
        }

        /* --- Progress Bar --- */
        #progress-container { margin-top: 1.5rem; display: none; }
        progress {
          width: 100%; -webkit-appearance: none; appearance: none;
          height: 10px; border-radius: 5px; overflow: hidden;
        }
        progress::-webkit-progress-bar { background-color: #eee; border-radius: 5px; }
        progress::-webkit-progress-value { background-color: var(--primary-color); transition: width 0.3s; }

        /* --- Wizard --- */
        #wizard { display: none; margin-top: 2rem; text-align: left; }
        .form-group { margin-bottom: 1.5rem; }
        .form-group label { display: block; font-weight: 700; margin-bottom: 0.5rem; color: #333; }
        .form-group select {
          width: 100%; padding: 12px; font-size: 1em; border-radius: 8px;
          border: 1px solid #ccc; background-color: white;
        }

        /* --- Buttons --- */
        .button {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 0.75rem; background-image: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
          color: white; border: none; padding: 16px 32px; font-size: 1.2em; font-weight: 700;
          border-radius: var(--border-radius, 12px); cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(94, 93, 240, 0.4);
          min-width: 250px;
        }
        .button:hover { transform: translateY(-3px); box-shadow: 0 7px 20px rgba(94, 93, 240, 0.5); }
        .button:disabled {
          background-image: none; background-color: #bdc3c7;
          cursor: not-allowed; transform: none; box-shadow: none;
        }
        .button svg { width: 20px; height: 20px; }

        /* --- Result --- */
        #result {
          margin-top: 2rem; font-size: 1.5em; font-weight: 700;
          min-height: 40px; color: var(--primary-color);
          opacity: 0; transform: translateY(10px);
          transition: opacity 0.5s, transform 0.5s;
        }
        #result.visible { opacity: 1; transform: translateY(0); }
      </style>
      
      <div class="container">
        <div id="upload-area">
            <label for="file-input" class="upload-label" id="drop-zone">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V21h18v-3.75m-18 0V5.625c0-1.036.84-1.875 1.875-1.875h14.25c1.035 0 1.875.84 1.875 1.875v11.625" /></svg>
              <span>ファイルをドラッグ＆ドロップ<br>または <strong>クリックして選択</strong></span>
            </label>
            <input type="file" id="file-input" multiple accept="image/*">
            <div id="preview-grid"></div>
            <div id="progress-container">
              <progress id="progress-bar" value="0" max="100"></progress>
            </div>
            <button id="next-btn" class="button" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-1.125 0-2.25 1.125-2.25 2.25v15c0 1.125 1.125 2.25 2.25 2.25h10.5c1.125 0 2.25-1.125 2.25-2.25v-15c0-1.125-1.125-2.25-2.25-2.25h-4.5m-7.5 15l4.125-4.125a3.375 3.375 0 015.25 0L21 18.75m-18 0h18" /></svg>
              <span>アップロードして次へ</span>
            </button>
        </div>

        <div id="wizard">
          <div class="form-group">
            <label for="book-size">本の主なサイズを選択してください</label>
            <select id="book-size">
              <option value="paperback">文庫本 (A6) - 10.5cm × 14.8cm</option>
              <option value="hardcover" selected>単行本・ハードカバー (B6) - 12.8cm × 18.2cm</option>
              <option value="magazine">雑誌・大型本 (A4) - 21.0cm × 29.7cm</option>
            </select>
          </div>
          <div class="form-group">
            <label for="book-thickness">本の平均的な厚さを選択してください</label>
            <select id="book-thickness">
              <option value="thin">薄い (約1.5cm)</option>
              <option value="medium" selected>普通 (約2.5cm)</option>
              <option value="thick">厚い (約4cm)</option>
            </select>
          </div>
          <button id="calculate-btn" class="button">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M21 7.5l-2.25-1.313M21 7.5v2.25m0-2.25l-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3l2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0-2.25l2.25 1.313M4.5 9.75l-2.25 1.313M4.5 9.75v2.25m15-2.25l-2.25 1.313m-12.75 0l2.25-1.313M4.5 12l2.25 1.313M19.5 12l-2.25 1.313m-12.75 0l2.25 1.313m10.5-3.937V4.5m-10.5 3.937V4.5" /></svg>
              <span>箱の数を計算する</span>
          </button>
        </div>

        <div id="result"></div>
      </div>
    `;
  }

  connectedCallback() {
    // --- Element Refs ---
    const fileInput = this.shadowRoot.querySelector('#file-input');
    const nextBtn = this.shadowRoot.querySelector('#next-btn');
    const calculateBtn = this.shadowRoot.querySelector('#calculate-btn');
    const resultDiv = this.shadowRoot.querySelector('#result');
    const previewGrid = this.shadowRoot.querySelector('#preview-grid');
    const dropZone = this.shadowRoot.querySelector('#drop-zone');
    const progressContainer = this.shadowRoot.querySelector('#progress-container');
    const progressBar = this.shadowRoot.querySelector('#progress-bar');
    const nextBtnText = this.shadowRoot.querySelector('#next-btn span');
    const uploadArea = this.shadowRoot.querySelector('#upload-area');
    const wizard = this.shadowRoot.querySelector('#wizard');
    const bookSizeSelect = this.shadowRoot.querySelector('#book-size');
    const bookThicknessSelect = this.shadowRoot.querySelector('#book-thickness');

    // --- Logic ---
    const updateFileList = () => {
      previewGrid.innerHTML = '';
      if (this.files.length === 0) {
        nextBtn.disabled = true;
      } else {
        nextBtn.disabled = false;
        for (const file of this.files) {
          const reader = new FileReader();
          reader.onload = (e) => {
            const img = document.createElement('img');
            img.src = e.target.result;
            img.classList.add('preview-img');
            previewGrid.appendChild(img);
          }
          reader.readAsDataURL(file);
        }
      }
    };

    const handleFiles = (files) => {
        this.files = Array.from(files).filter(f => f.type.startsWith('image/'));
        updateFileList();
    }
    
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

    nextBtn.addEventListener('click', async () => {
      if (this.files.length === 0) {
        resultDiv.textContent = 'まず写真を選択してください。';
        resultDiv.style.color = '#e74c3c';
        resultDiv.classList.add('visible');
        return;
      }

      nextBtn.disabled = true;
      nextBtnText.textContent = 'アップロード中...';
      resultDiv.classList.remove('visible');
      progressContainer.style.display = 'block';
      progressBar.value = 0;

      const uploadTasks = this.files.map(file => ({
          task: storage.ref(`uploads/${Date.now()}-${file.name}`).put(file),
          size: file.size
      }));
      
      let totalBytes = uploadTasks.reduce((acc, t) => acc + t.size, 0);
      
      const promises = uploadTasks.map(upload => {
        return new Promise((resolve, reject) => {
          upload.task.on('state_changed',
            (snapshot) => {
              let totalTransferred = uploadTasks.reduce((acc, t) => acc + t.task.snapshot.bytesTransferred, 0);
              progressBar.value = (totalTransferred / totalBytes) * 100;
            },
            reject,
            resolve
          );
        });
      });

      try {
        await Promise.all(promises);
        uploadArea.style.display = 'none';
        wizard.style.display = 'block';
      } catch (error) {
        console.error("Upload failed:", error);
        resultDiv.style.color = '#e74c3c';
        resultDiv.textContent = 'エラー: ファイルのアップロードに失敗しました。';
        resultDiv.classList.add('visible');
        nextBtn.disabled = false;
        nextBtnText.textContent = 'アップロードして次へ';
        progressContainer.style.display = 'none';
      }
    });

    calculateBtn.addEventListener('click', () => {
        const bookCount = this.files.length;
        const bookSize = bookSizeSelect.value;
        const bookThickness = bookThicknessSelect.value;

        const bookDimensions = {
            paperback: { w: 10.5, h: 14.8 },
            hardcover: { w: 12.8, h: 18.2 },
            magazine: { w: 21.0, h: 29.7 },
        };
        const thicknessValues = {
            thin: 1.5,
            medium: 2.5,
            thick: 4.0,
        };

        const book = bookDimensions[bookSize];
        const thickness = thicknessValues[bookThickness];
        const singleBookVolume = book.w * book.h * thickness;
        const totalBookVolume = singleBookVolume * bookCount;

        // 一般的な100サイズの箱: 38cm x 27cm x 29cm
        const boxVolume = 38 * 27 * 29;
        const packingEfficiency = 0.85; // 85%の充填率と仮定

        const requiredBoxes = Math.ceil(totalBookVolume / (boxVolume * packingEfficiency));
        
        wizard.style.display = 'none';
        resultDiv.textContent = `📦 推定される箱の数: 約 ${requiredBoxes} 箱`;
        resultDiv.classList.add('visible');
    });
  }
}

customElements.define('box-estimator', BoxEstimator);
