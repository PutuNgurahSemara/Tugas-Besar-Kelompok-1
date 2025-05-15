<?php

namespace App\Console\Commands;

use App\Services\NotificationService;
use Illuminate\Console\Command;

class CheckNotifications extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'check:notifications';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Memeriksa berbagai kondisi dan membuat notifikasi jika diperlukan';

    /**
     * Create a new command instance.
     */
    public function __construct(private NotificationService $notificationService)
    {
        parent::__construct();
    }

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Memulai pemeriksaan notifikasi...');
        
        $stats = $this->notificationService->runAllChecks();
        
        $this->info('Pemeriksaan selesai dengan hasil:');
        $this->table(
            ['Tipe', 'Jumlah Notifikasi'],
            collect($stats)->map(fn ($count, $type) => [$type, $count])->toArray()
        );
        
        return Command::SUCCESS;
    }
}
