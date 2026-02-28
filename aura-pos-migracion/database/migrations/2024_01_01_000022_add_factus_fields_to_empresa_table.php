<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('empresa', function (Blueprint $table) {
            $table->boolean('factura_electronica')->default(false)->after('activa');
            $table->string('factus_client_id', 255)->nullable()->after('factura_electronica');
            $table->string('factus_client_secret', 500)->nullable()->after('factus_client_id');
            $table->string('factus_username', 255)->nullable()->after('factus_client_secret');
            $table->string('factus_password', 500)->nullable()->after('factus_username');
            $table->integer('factus_numbering_range_id')->nullable()->after('factus_password');
            $table->string('factus_prefijo', 20)->nullable()->after('factus_numbering_range_id');
            $table->text('factus_access_token')->nullable()->after('factus_prefijo');
            $table->text('factus_refresh_token')->nullable()->after('factus_access_token');
            $table->timestamp('factus_token_expiry')->nullable()->after('factus_refresh_token');
        });
    }

    public function down(): void
    {
        Schema::table('empresa', function (Blueprint $table) {
            $table->dropColumn([
                'factura_electronica',
                'factus_client_id',
                'factus_client_secret',
                'factus_username',
                'factus_password',
                'factus_numbering_range_id',
                'factus_prefijo',
                'factus_access_token',
                'factus_refresh_token',
                'factus_token_expiry',
            ]);
        });
    }
};