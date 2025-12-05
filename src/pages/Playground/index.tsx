import { useState } from 'react';
import MarkdownPreview from '../../components/MarkdownPreview';
import './Playground.css';

function Playground() {
  const [markdown, setMarkdown] = useState(String.raw``);
  const [enableSyntaxFix, setEnableSyntaxFix] = useState(true);
  const [initialSpeed, setInitialSpeed] = useState<'slow' | 'medium' | 'fast' | 'veryFast'>('slow');
  const [maxSpeed, setMaxSpeed] = useState<'slow' | 'medium' | 'fast' | 'veryFast'>('veryFast');

  return (
    <div className="playground-container">
      <div className="editor-section">
        <h3>Markdown 输入</h3>
        
        <div className="input-group">
          <textarea
            className="markdown-input"
            value={markdown}
            onChange={(e) => setMarkdown(e.target.value)}
            placeholder="在此输入 Markdown 内容..."
          />
          
          <div className="options-section" style={{flexWrap: 'wrap', gap: '15px'}}>
            <label className="option-label">
              <input
                type="checkbox"
                checked={enableSyntaxFix}
                onChange={(e) => setEnableSyntaxFix(e.target.checked)}
              />
              启用语法修复
            </label>
          </div>
        </div>
      </div>
      
      <div className="preview-section">
        <h3>渲染预览</h3>
        
        <div className="preview-wrapper" style={{display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0}}>
            <div className="top-options-section" style={{display: 'flex', flexWrap: 'wrap', gap: '15px'}}>
                 <label className="option-label">
                   初始速度:
                   <select 
                     value={initialSpeed} 
                     onChange={(e) => setInitialSpeed(e.target.value as any)}
                   >
                     <option value="slow">慢速 (Slow)</option>
                     <option value="medium">中速 (Medium)</option>
                     <option value="fast">快速 (Fast)</option>
                     <option value="veryFast">极速 (Very Fast)</option>
                   </select>
                 </label>

                 <label className="option-label">
                   最大速度:
                   <select 
                     value={maxSpeed} 
                     onChange={(e) => setMaxSpeed(e.target.value as any)}
                   >
                     <option value="slow">慢速 (Slow)</option>
                     <option value="medium">中速 (Medium)</option>
                     <option value="fast">快速 (Fast)</option>
                     <option value="veryFast">极速 (Very Fast)</option>
                   </select>
                 </label>
            </div>

            <MarkdownPreview 
              rawMarkdown={markdown} 
              config={{
                initialSpeed: initialSpeed,
                maxSpeed: maxSpeed,
                showStatus: true,
                enableSyntaxFix
              }}
            />
        </div>
      </div>
    </div>
  );
}

export default Playground;
