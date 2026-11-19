import { describe, it, expect } from 'vitest';
import { getYouTubeEmbedUrl } from '../helpers';

describe('getYouTubeEmbedUrl Function', () => {
    it('պետք է վերադարձնի ճիշտ embed URL ստանդարտ YouTube հղման համար', () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const expected = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
        expect(getYouTubeEmbedUrl(url)).toBe(expected);
    });

    it('պետք է ճիշտ աշխատի կարճ (youtu.be) հղումների դեպքում', () => {
        const url = 'https://youtu.be/dQw4w9WgXcQ';
        const expected = 'https://www.youtube.com/embed/dQw4w9WgXcQ';
        expect(getYouTubeEmbedUrl(url)).toBe(expected);
    });

    it('պետք է վերադարձնի null, եթե հղումը սխալ է, դատարկ է կամ null է', () => {
        expect(getYouTubeEmbedUrl('https://google.com')).toBeNull();
        expect(getYouTubeEmbedUrl(null)).toBeNull();
        expect(getYouTubeEmbedUrl('')).toBeNull();
    });
});