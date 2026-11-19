import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CourseCardSkeleton } from '../../components/CourseCardSkeleton';

describe('CourseCardSkeleton Component', () => {
    
    it('պետք է անխափան ռենդեր լինի (առանց քրաշվելու)', () => {
        // 1. Ռենդեր ենք անում կոմպոնենտը վիրտուալ DOM-ում (jsdom)
        const { container } = render(<CourseCardSkeleton />);
        
        // 2. Ստուգում ենք, որ գլխավոր հանգույցը (node) իսկապես գոյություն ունի Document-ում
        expect(container.firstChild).toBeInTheDocument();
    });

    it('պետք է ունենա animate-pulse դասը (Skeleton-ի թարթելու էֆեկտի համար)', () => {
        const { container } = render(<CourseCardSkeleton />);
        
        // Վերցնում ենք գլխավոր div-ը և ստուգում դրա Tailwind դասերը
        const mainDiv = container.firstChild as HTMLElement;
        
        // 3. toHaveClass-ը գալիս է '@testing-library/jest-dom'-ից (setupTests.ts-ի շնորհիվ)
        expect(mainDiv).toHaveClass('animate-pulse');
        expect(mainDiv).toHaveClass('bg-white');
    });

});