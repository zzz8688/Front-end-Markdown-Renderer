import { useState, useEffect, useRef } from 'react';
import { markdownToHtml } from '../utils/markdownToHtml';
import { useStreamingText } from '../hooks/useStreamingText';

interface MarkdownPreviewProps {
    rawMarkdown: string;
    config?: {
        initialSpeed?: 'slow' | 'medium' | 'fast' | 'veryFast';
        maxSpeed?: 'slow' | 'medium' | 'fast' | 'veryFast';
        showStatus?: boolean;
        enableSyntaxFix?: boolean;
    };
}

export const MarkdownPreview = ({ 
    rawMarkdown, 
    config = {} 
}: MarkdownPreviewProps) => {
    const { 
        initialSpeed = 'slow',
        maxSpeed = 'medium',
        showStatus = true,
        enableSyntaxFix = true
    } = config;

    const getSpeedConfig = () => {
        const speedLevels = {
            slow: 1,
            medium: 2,
            fast: 3,
            veryFast: 4
        };

        const initialConfigs = {
            slow: { k: 0.010, damping: 0.9, mass: 4.0 },
            medium: { k: 0.018, damping: 0.8, mass: 3.0 },
            fast: { k: 0.065, damping: 0.6, mass: 2.0 },
            veryFast: { k: 100.0, damping: 0.001, mass: 0.001 }
        };

        const tailConfigs = {
            slow: { k: 0.0005, damping: 0.8, mass: 8.0, minVelocity: 0.5 },
            medium: { k: 0.0015, damping: 0.7, mass: 4.5, minVelocity: 1 },
            fast: { k: 0.01, damping: 0.4, mass: 2.0, minVelocity: 2 },
            veryFast: { k: 100.0, damping: 1.5, mass: 0.0001, minVelocity: 20000 }
        };

        let effectiveInitialSpeed = initialSpeed;
        
        const initialLevel = speedLevels[initialSpeed];
        const maxLevel = speedLevels[maxSpeed];

        if (initialLevel > maxLevel) {
             effectiveInitialSpeed = maxSpeed;
        }
        
        const initialConfig = initialConfigs[effectiveInitialSpeed];
        const maxConfig = tailConfigs[maxSpeed];
        
        return {
            initialSpringK: initialConfig.k,
            initialDamping: initialConfig.damping,
            initialMass: initialConfig.mass,
            tailSpringK: maxConfig.k,
            tailDamping: maxConfig.damping,
            tailMass: maxConfig.mass,
            tailThreshold: 20,
            minTailVelocity: maxConfig.minVelocity,
            enableSyntaxFix: enableSyntaxFix
        };
    };

    const { currentText, isComplete, isTail } = useStreamingText(
        rawMarkdown, 
        getSpeedConfig()
    );

    const [renderedHtml, setRenderedHtml] = useState('');
    const convertTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (convertTimeoutRef.current) {
            clearTimeout(convertTimeoutRef.current);
        }

        if (!currentText) {
            setRenderedHtml('');
            return;
        }

        const shouldApplyFix = enableSyntaxFix;
        
        const renderMarkdown = async () => {
            try {
                const html = await markdownToHtml(currentText, { enableSyntaxFix: shouldApplyFix });
                setRenderedHtml(html);
            } catch (error) {
                console.error('Markdown error:', error);
                setRenderedHtml('<p style="color: red;">Markdown Parse Error</p>');
            }
        };

        renderMarkdown();
        
    }, [currentText, isComplete, enableSyntaxFix]);

    const getStatusText = () => {
       if (isComplete) return '（渲染完成）';
       if (isTail) return '（快速渲染中）';
       return '（平滑渲染中）';
    };

    const handleLinkClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const target = (e.target as HTMLElement).closest('a');
        if (!target) return;

        const href = target.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const id = href.slice(1);
            const element = document.getElementById(id);
            const container = e.currentTarget;

            if (element && container.contains(element)) {
                const containerRect = container.getBoundingClientRect();
                const elementRect = element.getBoundingClientRect();
                
                const targetScrollTop = container.scrollTop + (elementRect.top - containerRect.top) - 20;
                
                container.scrollTo({
                    top: targetScrollTop,
                    behavior: 'smooth'
                });
            }
        }
    };

    return (
        <div className="markdown-preview-container" style={{position: 'relative'}}>
            {showStatus && (
                <div style={{
                    position: 'absolute',
                    top: '5px',
                    right: '20px',
                    fontSize: '12px',
                    color: isComplete ? '#2da44e' : '#0969da',
                    background: 'rgba(255,255,255,0.9)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    border: '1px solid #e1e4e8',
                    zIndex: 10,
                    pointerEvents: 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                }}>
                    {getStatusText()}
                </div>
            )}
            <div
                className={`preview-content ${
                    isComplete ? 'complete-mode interaction-enabled' : 
                    isTail ? 'tail-mode' : 'streaming-mode'
                }`}
                dangerouslySetInnerHTML={{ __html: renderedHtml }}
                onClick={handleLinkClick}
            />
        </div>
    );
};

export default MarkdownPreview;