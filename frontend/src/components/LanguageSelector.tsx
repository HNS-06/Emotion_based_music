import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export type MusicLanguage = 'English' | 'Hindi' | 'Tamil' | 'Malayalam';

interface LanguageSelectorProps {
    currentLanguage: MusicLanguage;
    onLanguageChange: (language: MusicLanguage) => void;
}

export default function LanguageSelector({ currentLanguage, onLanguageChange }: LanguageSelectorProps) {
    return (
        <div className="flex items-center gap-2 bg-white/5 backdrop-blur-md rounded-full px-3 py-1 border border-white/10">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <Select value={currentLanguage} onValueChange={(val) => onLanguageChange(val as MusicLanguage)}>
                <SelectTrigger className="h-8 border-none bg-transparent focus:ring-0 focus:ring-offset-0 gap-2 text-sm font-medium">
                    <SelectValue placeholder="Language" />
                </SelectTrigger>
                <SelectContent className="glass-card border-white/20">
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Tamil">Tamil</SelectItem>
                    <SelectItem value="Malayalam">Malayalam</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
