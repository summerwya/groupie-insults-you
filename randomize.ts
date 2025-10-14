/**
 * Randomizes text using [] and/or {}
 * 
 * @param template String template that has randomization tags
 * @returns Randomized string of text from template
 */
export default function randomize(template: string | string[]) {
    const selectedTemplate: string = typeof template === 'string' ? template : template[Math.floor(Math.random() * template.length)]!;

    function replaceOption(match: any, p1: string) {
        const options = p1.split('|');

        if (options.length === 1 && !p1.includes('*')) return match;

        let selected = options[Math.floor(Math.random() * options.length)]!;

        const starIndex = selected.lastIndexOf('*');
        if (starIndex !== -1) {
            const afterStar = selected.slice(starIndex + 1);
            if (/^\d+$/.test(afterStar)) {
                const beforeStar = selected.slice(0, starIndex);
                const n = parseInt(afterStar, 10);
                const repeatCount = Math.floor(Math.random() * n);
                const lastChar = beforeStar.slice(-1);
                selected = beforeStar + lastChar.repeat(repeatCount);
            }
        }

        return selected;
    }

    // Process {} first, then []
    const pass1 = selectedTemplate.replace(/\{(.*?)}/g, replaceOption).replace(/\[(.*?)]/g, replaceOption);
    let roll = Math.floor(Math.random()*4);

    if (roll === 0) return randomlyCase(pass1);
    else if (roll === 1) return pass1.toUpperCase();
    else if (roll === 2) return pass1.toLowerCase();
    else return pass1;
}

export function randomlyCase(toFix: string): string {
    let out = toFix.split('');
    for(let i = 0; i < out.length; i++) out[i] = Math.floor(Math.random() * 2) == 1 ? out[i]!.toUpperCase() : out[i]!.toLowerCase();
    return out.join('');
}