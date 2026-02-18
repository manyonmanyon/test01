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
          padding: 20px;
          border: 2px dashed var(--primary-color, #3498db);
          border-radius: var(--border-radius, 8px);
          background-color: #fdfdfd;
          transition: background-color 0.2s;
        }
        .container.dragover {
          background-color: #e9f5ff;
        }
        #file-input {
          display: none;
        }
        label[for="file-input"] {
          display: block;
          padding: 30px;
          cursor: pointer;
          font-size: 1.1em;
          color: #555;
        }
        label[for="file-input"] strong {
          color: var(--primary-color, #3498db);
          font-weight: 600;
        }
        button {
          background-color: var(--primary-color, #3498db);
          color: white;
          border: none;
          padding: 15px 30px;
          font-size: 1.1em;
          border-radius: var(--border-radius, 8px);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        button:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.15);
        }
        button:disabled {
          background-color: #bdc3c7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }
        #result {
          margin-top: 25px;
          font-size: 1.4em;
          font-weight: bold;
          min-height: 30px;
          transition: color 0.3s;
        }
        #file-list {
          margin-top: 15px;
          text-align: left;
          color: #666;
        }
      </style>
      <div class="container" id="drop-zone">
        <label for="file-input">
          ここにファイルをドラッグ＆ドロップするか、<br><strong>クリックしてファイルを選択</strong>してください。
        </label>
        <input type="file" id="file-input" multiple accept="image/*">
        <div id="file-list"></div>
        <button id="estimate-btn" disabled>箱の数を予測する</button>
        <div id="result"></div>
      </div>
    `;
  }

  connectedCallback() {
    const fileInput = this.shadowRoot.querySelector('#file-input');
    const estimateBtn = this.shadowRoot.querySelector('#estimate-btn');
    const resultDiv = this.shadowRoot.querySelector('#result');
    const fileListDiv = this.shadowRoot.querySelector('#file-list');
    const dropZone = this.shadowRoot.querySelector('#drop-zone');

    const updateFileList = () => {
      if (this.files.length === 0) {
        fileListDiv.innerHTML = '';
        estimateBtn.disabled = true;
      } else {
        fileListDiv.innerHTML = `<p>${this.files.length}個のファイルが選択されています。</p>`;
        estimateBtn.disabled = false;
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
            this.files = Array.from(e.dataTransfer.files);
            updateFileList();
        }
    });

    fileInput.addEventListener('change', (e) => {
      this.files = Array.from(e.target.files);
      updateFileList();
    });

    estimateBtn.addEventListener('click', () => {
      const fileCount = this.files.length;
      if (fileCount === 0) {
        resultDiv.textContent = 'まず写真を選択してください。';
        resultDiv.style.color = '#e74c3c';
        return;
      }

      // 予測ロジック: 写真5枚につき1箱
      const boxes = Math.ceil(fileCount / 5);
      
      resultDiv.style.color = 'var(--primary-color, #3498db)';
      resultDiv.textContent = `予測される箱の数: 約 ${boxes} 箱`;
    });
  }
}

customElements.define('box-estimator', BoxEstimator);
