<?php

namespace Academorix\OmniTerm\Samples;

use Illuminate\Console\Command;
use Academorix\OmniTerm\HasOmniTerm;

/**
 * Sample: Visual Elements
 *
 * Demonstrates boxes and horizontal rules.
 *
 * Run: php artisan omniterm:visual-elements
 */
class VisualElementsCommand extends Command
{
    use HasOmniTerm;

    protected $signature = 'omniterm:visual-elements';

    protected $description = 'OmniTerm Sample: Visual Elements (Boxes & Lines)';

    public function handle(): int
    {
        $this->omni->titleBar('Visual Elements', 'violet');
        $this->omni->newLine();

        // Title bars (compact single-line colored bar)
        $this->omni->titleBar('Title Bar - Default', 'cyan');

        $this->omni->newLine();

        $this->omni->titleBar('Title Bar - Styled', 'cyan');

        $this->omni->newLine();

        $this->omni->titleBar('Success Bar', 'emerald');

        $this->omni->newLine();

        $this->omni->titleBar('Warning Bar', 'amber');

        $this->omni->newLine();

        // Square boxes
        $this->omni->box('Square Box - Default');

        $this->omni->newLine();

        $this->omni->box('Square Box - Styled', 'text-rose-500', 'text-rose-300');

        $this->omni->newLine();

        // Horizontal rules
        $this->omni->info('Horizontal Rules:');
        $this->omni->newLine();

        $this->line('  Default (gray):');
        $this->omni->hr();

        $this->omni->newLine();
        $this->line('  Custom color:');
        $this->omni->hr('text-purple-500');

        $this->omni->newLine();
        $this->line('  Success (green):');
        $this->omni->hrSuccess();

        $this->omni->newLine();
        $this->line('  Error (red):');
        $this->omni->hrError();

        $this->omni->newLine();
        $this->line('  Warning (amber):');
        $this->omni->hrWarning();

        $this->omni->newLine();
        $this->line('  Info (blue):');
        $this->omni->hrInfo();

        $this->omni->newLine();
        $this->line('  Disabled (gray):');
        $this->omni->hrDisabled();

        $this->omni->newLine();

        // Combined example
        $this->omni->titleBar('Section Title', 'sky');
        $this->omni->tableRow('Item 1', 'Value 1');
        $this->omni->tableRow('Item 2', 'Value 2');
        $this->omni->tableRow('Item 3', 'Value 3');
        $this->omni->hrInfo();

        return Command::SUCCESS;
    }
}
