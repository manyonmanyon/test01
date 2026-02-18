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
        #file-input {
          display: none;
        }
        .upload-label {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2.5rem;
          cursor: pointer;
          font-size: 1.1em;
          color: #555;
          text-align: center;
        }
        .upload-label svg {
          width: 50px;
          height: 50px;
          margin-bottom: 1rem;
          color: var(--primary-color, #5E5DF0);
        }
        .upload-label strong {
          color: var(--primary-color, #5E5DF0);
          font-weight: 700;
        }
        button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          background-image: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
          color: white;
          border: none;
          padding: 16px 32px;
          font-size: 1.2em;
          font-weight: 700;
          border-radius: var(--border-radius, 12px);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 4px 15px rgba(94, 93, 240, 0.4);
          min-width: 250px;
        }
        button:hover {
          transform: translateY(-3px);
          box-shadow: 0 7px 20px rgba(94, 93, 240, 0.5);
        }
        button:disabled {
          background-image: none;
          background-color: #bdc3c7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        button svg {
            width: 20px;
            height: 20px;
        }
        #result {
          margin-top: 2rem;
          font-size: 1.5em;
          font-weight: 700;
          min-height: 40px;
          color: var(--primary-color);
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 0.5s, transform 0.5s;
        }
        #result.visible {
          opacity: 1;
          transform: translateY(0);
        }
        #preview-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem;
          margin-top: 1.5rem;
        }
        .preview-img {
          width: 100%;
          height: 100px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid #eee;
        }
        #progress-container {
          margin-top: 1.5rem;
          display: none;
        }
        progress {
          width: 100%;
          -webkit-appearance: none;
          appearance: none;
          height: 10px;
          border-radius: 5px;
          overflow: hidden;
        }
        progress::-webkit-progress-bar {
          background-color: #eee;
          border-radius: 5px;
        }
        progress::-webkit-progress-value {
          background-color: var(--primary-color);
          transition: width 0.3s;
        }
      </style>
      <div class="container" id="drop-zone">
        <label for="file-input" class="upload-label">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V21h18v-3.75m-18 0V5.625c0-1.036.84-1.875 1.875-1.875h14.25c1.035 0 1.875.84 1.875 1.875v11.625" /></svg>
          <span>ファイルをドラッグ＆ドロップ<br>または <strong>クリックして選択</strong></span>
        </label>
        <input type="file" id="file-input" multiple accept="image/*">
        <div id="preview-grid"></div>
        <div id="progress-container">
          <progress id="progress-bar" value="0" max="100"></progress>
        </div>
        <button id="estimate-btn" disabled>
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M10.125 2.25h-4.5c-1.125 0-2.25 1.125-2.25 2.25v15c0 1.125 1.125 2.25 2.25 2.25h10.5c1.125 0 2.25-1.125 2.25-2.25v-15c0-1.125-1.125-2.25-2.25-2.25h-4.5m-7.5 15l4.125-4.125a3.375 3.375 0 015.25 0L21 18.75m-18 0h18" /></svg>
          <span>アップロードして予測</span>
        </button>
        <div id="result"></div>
      </div>
    `;
  }

  connectedCallback() {
    const fileInput = this.shadowRoot.querySelector('#file-input');
    const estimateBtn = this.shadowRoot.querySelector('#estimate-btn');
    const resultDiv = this.shadowRoot.querySelector('#result');
    const previewGrid = this.shadowRoot.querySelector('#preview-grid');
    const dropZone = this.shadowRoot.querySelector('#drop-zone');
    const progressContainer = this.shadowRoot.querySelector('#progress-container');
    const progressBar = this.shadowRoot.querySelector('#progress-bar');
    const estimateBtnText = this.shadowRoot.querySelector('#estimate-btn span');

    const updateFileList = () => {
      previewGrid.innerHTML = '';
      if (this.files.length === 0) {
        estimateBtn.disabled = true;
      } else {
        estimateBtn.disabled = false;
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

    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files) {
        this.files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        updateFileList();
      }
    });

    fileInput.addEventListener('change', (e) => {
      this.files = Array.from(e.target.files).filter(f => f.type.startsWith('image/'));
      updateFileList();
    });

    estimateBtn.addEventListener('click', async () => {
      const fileCount = this.files.length;
      if (fileCount === 0) {
        resultDiv.textContent = 'まず写真を選択してください。';
        resultDiv.style.color = '#e74c3c';
        resultDiv.classList.add('visible');
        return;
      }

      estimateBtn.disabled = true;
      estimateBtnText.textContent = 'アップロード中...';
      resultDiv.classList.remove('visible');
      progressContainer.style.display = 'block';
      progressBar.value = 0;

      let totalBytes = 0;
      let totalBytesTransferred = 0;

      const uploadTasks = this.files.map(file => {
        totalBytes += file.size;
        const uniqueFileName = `${Date.now()}-${file.name}`;
        const storageRef = storage.ref(`uploads/${uniqueFileName}`);
        return { task: storageRef.put(file), file: file };
      });
      
      const promises = uploadTasks.map(upload => {
        return new Promise((resolve, reject) => {
          upload.task.on('state_changed',
            (snapshot) => {
              // This is a bit tricky, we need to track previous progress for each file
              // A simpler way for overall progress: recalculate on each event
              let currentTotalTransferred = 0;
              uploadTasks.forEach(t => {
                currentTotalTransferred += t.task.snapshot.bytesTransferred;
              });
              totalBytesTransferred = currentTotalTransferred;
              progressBar.value = (totalBytesTransferred / totalBytes) * 100;
            },
            (error) => reject(error),
            () => resolve()
          );
        });
      });

      try {
        await Promise.all(promises);
        
        const boxes = Math.ceil(fileCount / 5);
        
        resultDiv.textContent = `✅ アップロード完了！予測される箱の数: 約 ${boxes} 箱`;

      } catch (error) {
        console.error("Upload failed:", error);
        resultDiv.style.color = '#e74c3c';
        resultDiv.textContent = 'エラー: ファイルのアップロードに失敗しました。';
      } finally {
        resultDiv.classList.add('visible');
        estimateBtn.disabled = false;
        estimateBtnText.textContent = 'アップロードして予測';
        progressContainer.style.display = 'none';
      }
    });
  }
}

customElements.define('box-estimator', BoxEstimator);
