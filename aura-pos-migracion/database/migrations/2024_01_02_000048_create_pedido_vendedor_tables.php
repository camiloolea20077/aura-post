<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Secuencia para número de pedido
        DB::statement('CREATE SEQUENCE IF NOT EXISTS pedido_vendedor_seq START WITH 1 INCREMENT BY 1');

        Schema::create('pedido_vendedor', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedInteger('empresa_id');
            $table->unsignedInteger('sucursal_id');
            $table->unsignedInteger('vendedor_id');
            $table->unsignedBigInteger('cliente_id')->nullable();
            $table->string('numero_pedido', 30)->nullable();
            $table->string('estado', 30)->default('PENDIENTE_DESPACHO');
            $table->decimal('subtotal', 14, 2)->default(0);
            $table->decimal('descuento_total', 14, 2)->default(0);
            $table->decimal('impuesto_total', 14, 2)->default(0);
            $table->decimal('total', 14, 2)->default(0);
            $table->string('observaciones', 500)->nullable();
            $table->string('metodo_pago', 30)->nullable();
            $table->string('referencia_pago', 100)->nullable();
            $table->timestamp('fecha_cobro')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->foreign('empresa_id')->references('id')->on('empresa');
            $table->foreign('sucursal_id')->references('id')->on('sucursal');
            $table->foreign('vendedor_id')->references('id')->on('usuario');
            $table->foreign('cliente_id')->references('id')->on('tercero');
        });

        Schema::create('pedido_vendedor_detalle', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('pedido_vendedor_id');
            $table->unsignedBigInteger('producto_id');
            $table->decimal('cantidad', 12, 4);
            $table->decimal('precio_unitario', 14, 2);
            $table->decimal('descuento_valor', 14, 2)->default(0);
            $table->decimal('impuesto_valor', 14, 2)->default(0);
            $table->decimal('subtotal_linea', 14, 2);

            $table->foreign('pedido_vendedor_id')->references('id')->on('pedido_vendedor');
            $table->foreign('producto_id')->references('id')->on('producto');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pedido_vendedor_detalle');
        Schema::dropIfExists('pedido_vendedor');
        DB::statement('DROP SEQUENCE IF EXISTS pedido_vendedor_seq');
    }
};