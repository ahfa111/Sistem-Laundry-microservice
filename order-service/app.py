import os
import json
from datetime import date
from decimal import Decimal
from flask import Flask, request, jsonify
import psycopg2
import psycopg2.extras
import requests

class CustomJSONProvider(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, date):
            return obj.isoformat()
        return super().default(obj)

app = Flask(__name__)
app.json.compact = False
app.json_encoder = CustomJSONProvider

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_USER = os.environ.get('DB_USER', 'postgres')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'postgres')
DB_NAME = os.environ.get('DB_NAME', 'order_db')


def get_db_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )
        return conn
    except psycopg2.Error as e:
        print(f"Error connecting to PostgreSQL: {e}")
        return None


def init_db():
    conn = get_db_connection()

    if conn:
        cursor = conn.cursor()

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS orders (
                id SERIAL PRIMARY KEY,
                customer_id INT NOT NULL,
                service_id INT NOT NULL,
                voucher_id INT,
                order_date DATE NOT NULL,
                weight DECIMAL(5,2),
                total_price DECIMAL(10,2),
                status VARCHAR(50) DEFAULT 'Menunggu'
            )
        ''')

        cursor.execute('''
            CREATE TABLE IF NOT EXISTS order_items (
                id SERIAL PRIMARY KEY,
                order_id INT NOT NULL,
                item_name VARCHAR(255) NOT NULL,
                quantity INT NOT NULL,
                notes TEXT,
                FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
            )
        ''')

        cursor.execute('SELECT COUNT(*) FROM orders')
        if cursor.fetchone()[0] == 0:
            cursor.execute('''
                INSERT INTO orders (customer_id, service_id, voucher_id, order_date, weight, total_price, status) VALUES
                (1, 1, 1, '2026-06-09', 5.00, 35000.00, 'Menunggu'),
                (2, 2, NULL, '2026-06-10', 7.50, 52500.00, 'Diproses')
            ''')
            
            cursor.execute('''
                INSERT INTO order_items (order_id, item_name, quantity, notes) VALUES
                (1, 'Kemeja Putih', 3, 'Disetrika lipat'),
                (2, 'Karpet Bulu', 1, 'Cuci kering')
            ''')
            print("Inserted dummy data into PostgreSQL")

        conn.commit()
        cursor.close()
        conn.close()


init_db()


@app.route('/orders', methods=['GET'])
def get_orders():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('SELECT * FROM orders')
    orders = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(orders), 200


@app.route('/orders/<int:order_id>', methods=['GET'])
def get_order(order_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('SELECT * FROM orders WHERE id = %s', (order_id,))
    order = cursor.fetchone()

    cursor.close()
    conn.close()

    if order:
        return jsonify(order), 200

    return jsonify({'error': 'Order not found'}), 404


@app.route('/orders', methods=['POST'])
def create_order():
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid input'}), 400

    try:
        if 'customer_id' in data:
            cust_res = requests.get(f"http://customer-service:3002/customers/{data['customer_id']}")
            if cust_res.status_code != 200:
                return jsonify({'error': 'Customer ID not valid or not found in Customer Service'}), 400
        else:
            return jsonify({'error': 'customer_id is required'}), 400

        if 'service_id' in data:
            svc_res = requests.get(f"http://laundry-service:3001/laundry/{data['service_id']}")
            if svc_res.status_code != 200:
                return jsonify({'error': 'Service ID not valid or not found in Laundry Service'}), 400
        else:
            return jsonify({'error': 'service_id is required'}), 400

        if data.get('voucher_id'):
            vouch_res = requests.get(f"http://voucher-service:3002/vouchers/{data['voucher_id']}")
            if vouch_res.status_code != 200:
                return jsonify({'error': 'Voucher ID not valid or not found in Voucher Service'}), 400
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Service communication error: {str(e)}'}), 500

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor()
    sql = '''
        INSERT INTO orders
        (customer_id, service_id, voucher_id, order_date, weight, total_price, status)
        VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id
    '''
    values = (
        data['customer_id'],
        data['service_id'],
        data.get('voucher_id'),
        data['order_date'],
        data['weight'],
        data['total_price'],
        data.get('status', 'Menunggu')
    )
    cursor.execute(sql, values)
    new_id = cursor.fetchone()[0]
    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({
        'id': new_id,
        'customer_id': data['customer_id'],
        'service_id': data['service_id'],
        'voucher_id': data.get('voucher_id'),
        'order_date': data['order_date'],
        'weight': data['weight'],
        'total_price': data['total_price'],
        'status': data.get('status', 'Menunggu')
    }), 201


@app.route('/orders/<int:order_id>', methods=['PUT'])
def update_order(order_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid input'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('SELECT * FROM orders WHERE id = %s', (order_id,))
    order = cursor.fetchone()

    if not order:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Order not found'}), 404

    sql = '''
        UPDATE orders
        SET customer_id=%s, service_id=%s, voucher_id=%s, order_date=%s, weight=%s, total_price=%s, status=%s
        WHERE id=%s
    '''
    values = (
        data.get('customer_id', order['customer_id']),
        data.get('service_id', order['service_id']),
        data.get('voucher_id', order['voucher_id']),
        data.get('order_date', order['order_date']),
        data.get('weight', order['weight']),
        data.get('total_price', order['total_price']),
        data.get('status', order['status']),
        order_id
    )

    try:
        if values[0] != order['customer_id']:
            cust_res = requests.get(f"http://customer-service:3002/customers/{values[0]}")
            if cust_res.status_code != 200:
                return jsonify({'error': 'Customer ID not valid or not found in Customer Service'}), 400

        if values[1] != order['service_id']:
            svc_res = requests.get(f"http://laundry-service:3001/laundry/{values[1]}")
            if svc_res.status_code != 200:
                return jsonify({'error': 'Service ID not valid or not found in Laundry Service'}), 400

        if values[2] and values[2] != order['voucher_id']:
            vouch_res = requests.get(f"http://voucher-service:3002/vouchers/{values[2]}")
            if vouch_res.status_code != 200:
                return jsonify({'error': 'Voucher ID not valid or not found in Voucher Service'}), 400
    except requests.exceptions.RequestException as e:
        return jsonify({'error': f'Service communication error: {str(e)}'}), 500

    cursor.execute(sql, values)
    conn.commit()

    cursor.execute('SELECT * FROM orders WHERE id = %s', (order_id,))
    updated_order = cursor.fetchone()

    cursor.close()
    conn.close()

    return jsonify(updated_order), 200


@app.route('/orders/<int:order_id>', methods=['DELETE'])
def delete_order(order_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500

    cursor = conn.cursor()
    cursor.execute('DELETE FROM orders WHERE id = %s', (order_id,))
    conn.commit()

    affected_rows = cursor.rowcount
    cursor.close()
    conn.close()

    if affected_rows == 0:
        return jsonify({'error': 'Order not found'}), 404

    return jsonify({'message': 'Order deleted successfully'}), 200


@app.route('/order-items', methods=['GET'])
def get_order_items():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('SELECT * FROM order_items')
    items = cursor.fetchall()
    cursor.close()
    conn.close()
    return jsonify(items), 200

@app.route('/order-items/<int:item_id>', methods=['GET'])
def get_order_item(item_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    cursor.execute('SELECT * FROM order_items WHERE id = %s', (item_id,))
    item = cursor.fetchone()
    cursor.close()
    conn.close()
    if item:
        return jsonify(item), 200
    return jsonify({'error': 'Order item not found'}), 404

@app.route('/order-items', methods=['POST'])
def create_order_item():
    data = request.get_json()
    if not data or 'order_id' not in data or 'item_name' not in data or 'quantity' not in data:
        return jsonify({'error': 'order_id, item_name, and quantity are required'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cursor = conn.cursor()
    try:
        cursor.execute(
            'INSERT INTO order_items (order_id, item_name, quantity, notes) VALUES (%s, %s, %s, %s) RETURNING id',
            (data['order_id'], data['item_name'], data['quantity'], data.get('notes'))
        )
        new_id = cursor.fetchone()[0]
        conn.commit()
        return jsonify({'id': new_id, **data}), 201
    except psycopg2.Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        conn.close()

@app.route('/order-items/<int:item_id>', methods=['PUT'])
def update_order_item(item_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid input'}), 400

    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cursor = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    
    cursor.execute('SELECT * FROM order_items WHERE id = %s', (item_id,))
    item = cursor.fetchone()
    if not item:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Order item not found'}), 404

    cursor.execute(
        'UPDATE order_items SET item_name=%s, quantity=%s, notes=%s WHERE id=%s',
        (
            data.get('item_name', item['item_name']),
            data.get('quantity', item['quantity']),
            data.get('notes', item['notes']),
            item_id
        )
    )
    conn.commit()
    
    cursor.execute('SELECT * FROM order_items WHERE id = %s', (item_id,))
    updated_item = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify(updated_item), 200

@app.route('/order-items/<int:item_id>', methods=['DELETE'])
def delete_order_item(item_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
    cursor = conn.cursor()
    cursor.execute('DELETE FROM order_items WHERE id = %s', (item_id,))
    conn.commit()
    affected = cursor.rowcount
    cursor.close()
    conn.close()
    if affected == 0:
        return jsonify({'error': 'Order item not found'}), 404
    return jsonify({'message': 'Order item deleted successfully'}), 200

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=5002,
        debug=True
    )
