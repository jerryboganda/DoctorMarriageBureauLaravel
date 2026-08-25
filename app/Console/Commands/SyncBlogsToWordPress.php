<?php

namespace App\Console\Commands;

use App\Models\Blog;
use App\Services\WordPressSyncService;
use Illuminate\Console\Command;

class SyncBlogsToWordPress extends Command
{
    protected $signature = 'wp:sync-blogs {--id= : Sync a single blog by ID}';

    protected $description = 'Sync Laravel blogs to the WordPress marketing site.';

    public function handle(WordPressSyncService $service): int
    {
        $query = Blog::with('category');

        if ($this->option('id')) {
            $query->where('id', $this->option('id'));
        }

        $blogs = $query->get();

        if ($blogs->isEmpty()) {
            $this->warn('No blogs found to sync.');

            return self::SUCCESS;
        }

        $bar = $this->output->createProgressBar($blogs->count());
        $bar->start();

        foreach ($blogs as $blog) {
            $service->syncBlog($blog);
            $bar->advance();
        }

        $bar->finish();
        $this->newLine();
        $this->info('Blog sync complete.');

        return self::SUCCESS;
    }
}
