import { useState, useRef, useEffect, useCallback } from 'react';

interface UseStreamingTextOptions {
    initialSpringK?: number;
    initialDamping?: number;
    initialMass?: number;
    tailSpringK?: number;
    tailDamping?: number;
    tailMass?: number;
    minTailVelocity?: number;
    tailDetectionSensitivity?: number;
    enableSyntaxFix?: boolean;
}

const identifyFastRanges = (text: string, enableSyntaxFix: boolean): [number, number][] => {
    const ranges: [number, number][] = [];
    
    const processBlocks = (pattern: RegExp, isMath = false) => {
        const breakerRegex = isMath 
            ? /\n(?:(?:\s*\n(?=#{1,6}\s|\|))|(?=```))/
            : /\n(?:(?:\s*\n(?=#{1,6}\s|\|))|(?=\$\$))/;

        const globalPattern = new RegExp(pattern, 'g');
        let match;
        
        while ((match = globalPattern.exec(text)) !== null) {
            const start = match.index;
            const contentStart = start + match[0].length;
            
            let end = -1;
            const remaining = text.slice(contentStart);
            
            const closePattern = isMath ? /\$\$/ : /```/;
            const closeMatch = remaining.match(closePattern);
            const naturalEndIndex = closeMatch ? contentStart + closeMatch.index! : -1;
            
            let breakerIndex = -1;
            if (enableSyntaxFix) {
                const bMatch = remaining.match(breakerRegex);
                if (bMatch) {
                    breakerIndex = contentStart + bMatch.index!;
                }
            }
            
            if (enableSyntaxFix && breakerIndex !== -1 && (naturalEndIndex === -1 || breakerIndex < naturalEndIndex)) {
                end = breakerIndex;
                ranges.push([start, end]);
                globalPattern.lastIndex = end; 
            } else if (naturalEndIndex !== -1) {
                end = naturalEndIndex + closeMatch![0].length;
                ranges.push([start, end]);
                globalPattern.lastIndex = end;
            } else {
                if (enableSyntaxFix) {
                     globalPattern.lastIndex = text.length;
                }
            }
        }
    };

    processBlocks(/(^|\n)```/g, false);
    processBlocks(/(^|\n)\$\$/g, true);

    const inlineCodeRegex = /`[^`\n]+`/g;
    let match;
    while ((match = inlineCodeRegex.exec(text)) !== null) {
        ranges.push([match.index, match.index + match[0].length]);
    }

    const inlineMathRegex = /(?<!\\)\$[^$\n]+\$/g;
    while ((match = inlineMathRegex.exec(text)) !== null) {
        ranges.push([match.index, match.index + match[0].length]);
    }

    const linkImageRegex = /!?\[[^\]\n]*\]\([^)\n]*\)/g;
    while ((match = linkImageRegex.exec(text)) !== null) {
        ranges.push([match.index, match.index + match[0].length]);
    }

    const lines = text.split('\n');
    let currentStart = 0;
    let inTable = false;
    let tableStart = -1;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        const isHeader = trimmed.startsWith('#');
        const isEmpty = trimmed.length === 0;
        const isCodeFence = trimmed.startsWith('```');
        const hasPipe = line.includes('|');
        
        const isTableLine = hasPipe && !isCodeFence && !isHeader && !isEmpty;
        
        let isAlreadyCovered = false;
        const lineEnd = currentStart + line.length;
        for (const [rStart, rEnd] of ranges) {
             if (currentStart < rEnd && lineEnd > rStart) {
                 isAlreadyCovered = true;
                 break;
             }
        }
        
        if (isTableLine && !isAlreadyCovered) {
            if (!inTable) {
                inTable = true;
                tableStart = currentStart;
            }
        } else {
            if (inTable) {
                ranges.push([tableStart, currentStart]);
                inTable = false;
            }
        }
        currentStart += line.length + 1;
    }
    if (inTable) {
        ranges.push([tableStart, text.length]);
    }

    return ranges;
};

export const useStreamingText = (rawMarkdown: string, options?: UseStreamingTextOptions) => {
    const [currentText, setCurrentText] = useState(rawMarkdown);
    const [isComplete, setIsComplete] = useState(rawMarkdown.length === 0);
    const [isTail, setIsTail] = useState(false);
    
    const fastRangesRef = useRef<[number, number][]>([]);

    const defaultOptions: Required<UseStreamingTextOptions> = {
        initialSpringK: 0.01,
        initialDamping: 0.4,
        initialMass: 2.0,
        tailSpringK: 0.3,
        tailDamping: 0.2,
        tailMass: 1.0,
        minTailVelocity: 1,
        tailDetectionSensitivity: 0.8,
        enableSyntaxFix: false
    };

    const mergedOptions = { ...defaultOptions, ...options };

    const isCompleteRef = useRef(isComplete);
    const isTailRef = useRef(isTail);
    const optionsRef = useRef(mergedOptions);
    const markdownRef = useRef(rawMarkdown);
    
    const previousTextRef = useRef('');

    useEffect(() => {
        isCompleteRef.current = isComplete;
    }, [isComplete]);

    useEffect(() => {
        isTailRef.current = isTail;
    }, [isTail]);

    useEffect(() => {
        optionsRef.current = mergedOptions;
        fastRangesRef.current = identifyFastRanges(rawMarkdown, mergedOptions.enableSyntaxFix);
    }, [mergedOptions, rawMarkdown]);

    useEffect(() => {
        const previousLength = markdownRef.current.length;
        const newLength = rawMarkdown.length;
        
        markdownRef.current = rawMarkdown;
        
        if (newLength < previousLength) {
            springRef.current.target = newLength;
            springRef.current.position = newLength;
            springRef.current.velocity = 0;
            springRef.current.isProcessing = false;
            setIsComplete(true);
            setCurrentText(rawMarkdown);
            return;
        }
    }, [rawMarkdown]);

    const springRef = useRef({
        k: mergedOptions.initialSpringK,
        damping: mergedOptions.initialDamping,
        mass: mergedOptions.initialMass,
        target: rawMarkdown.length,
        position: 0,
        velocity: 0,
        animationFrame: null as number | null,
        isProcessing: false,
        hasStarted: false
    });

    const animate = useCallback(() => {
        if (!springRef.current.isProcessing) return;
        
        const options = optionsRef.current;
        let { target, position, velocity } = springRef.current;
        
        let isInFastRange = false;
        let currentFastRangeEnd = -1;
        for (const [start, end] of fastRangesRef.current) {
            if (position >= start && position < end) {
                isInFastRange = true;
                currentFastRangeEnd = end;
                break;
            }
        }

        const useFastMode = isInFastRange;
        
        if (isTailRef.current && !useFastMode) {
             velocity = 0;
             springRef.current.velocity = 0; 
        }

        if (isTailRef.current !== useFastMode) {
            setIsTail(useFastMode);
            isTailRef.current = useFastMode;
        }
        
        const k = useFastMode ? options.tailSpringK : options.initialSpringK;
        const damping = useFastMode ? options.tailDamping : options.initialDamping;
        const mass = useFastMode ? options.tailMass : options.initialMass;

        let effectiveTarget = target;
        if (!useFastMode) {
            const maxLead = 150;
            effectiveTarget = Math.min(target, position + maxLead);
        }

        const force = -k * (position - effectiveTarget) - damping * velocity;
        const acceleration = force / mass;
        
        let newVelocity = velocity + acceleration;
        
        if (useFastMode) {
            if (options.minTailVelocity > 1000) {
                const remaining = target - position;
                const instantVelocity = Math.max(remaining + 100, options.minTailVelocity);
                newVelocity = Math.max(newVelocity, instantVelocity);
            } else {
                newVelocity = Math.max(newVelocity, options.minTailVelocity * 2);
            }
        } else {
            if (position < target && newVelocity > 0 && newVelocity < 0.05) {
                newVelocity = 0.05;
            }
        }
        
        springRef.current.velocity = newVelocity;
        let nextPosition = position + springRef.current.velocity;

        if (useFastMode && currentFastRangeEnd !== -1) {
            if (nextPosition > currentFastRangeEnd) {
                nextPosition = currentFastRangeEnd;
            }
        }

        springRef.current.position = nextPosition;

        let shouldComplete = false;
        
        if (Math.abs(target - springRef.current.position) < 0.5) {
            springRef.current.position = target;
        }

        if (springRef.current.position >= target) {
            springRef.current.position = target;
            springRef.current.velocity = 0;
            shouldComplete = true;
        } else if (springRef.current.position < 0) {
            springRef.current.position = 0;
            springRef.current.velocity = 0;
        }

        const currentPos = Math.floor(springRef.current.position);
        const newText = markdownRef.current.slice(0, currentPos);
        
        if (newText !== previousTextRef.current) {
            setCurrentText(newText);
            previousTextRef.current = newText;
        }

        if (!shouldComplete) {
            springRef.current.animationFrame = requestAnimationFrame(animate);
        } else {
            setIsComplete(true);
            springRef.current.isProcessing = false;
            setCurrentText(markdownRef.current);
            if (springRef.current.animationFrame) {
                cancelAnimationFrame(springRef.current.animationFrame);
                springRef.current.animationFrame = null;
            }
        }
    }, []);

    const startAnimation = useCallback(() => {
        if (!springRef.current.isProcessing) {
            springRef.current.isProcessing = true;
            springRef.current.hasStarted = true;
            springRef.current.target = rawMarkdown.length;
            setIsComplete(false);
            animate();
        }
    }, [animate, rawMarkdown.length]);

    useEffect(() => {
        if (rawMarkdown.length === 0) {
            setIsComplete(true);
            return;
        }

        if (rawMarkdown.length > 0) {
            springRef.current.target = rawMarkdown.length;
            if (!springRef.current.isProcessing && !isCompleteRef.current) {
                startAnimation();
            } else if (isCompleteRef.current && springRef.current.position < rawMarkdown.length) {
                setIsComplete(false);
                springRef.current.isProcessing = true;
                animate();
            }
        }
    }, [rawMarkdown, startAnimation, animate]);

    return {
        currentText,
        isComplete,
        isTail
    };
};
