import os
from flask import Flask, request, jsonify
import mysql.connector
from mysql.connector import Error

app = Flask(__name__)

# DB Configuration
DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'laundry_db')

def get_db_connection():
    try:
        conn = mysql.connector.connect(
            host=DB_HOST,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME
        )
        return conn
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def init_db():
    conn = get_db_connection()
    if conn:
        cursor = conn.cursor()
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS payments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                order_id INT NOT NULL,
                amount DECIMAL(10, 2) NOT NULL,
                status VARCHAR(50) DEFAULT 'pending',
                payment_method VARCHAR(50)
            )
        ''')
        conn.commit()
        cursor.close()
        conn.close()

# Initialize DB on startup
init_db()

@app.route('/payments', methods=['GET'])
def get_payments():
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
        
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM payments')
    payments = cursor.fetchall()
    
    cursor.close()
    conn.close()
    
    return jsonify(payments), 200

@app.route('/payments/<int:payment_id>', methods=['GET'])
def get_payment(payment_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
        
    cursor = conn.cursor(dictionary=True)
    cursor.execute('SELECT * FROM payments WHERE id = %s', (payment_id,))
    payment = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    if payment:
        return jsonify(payment), 200
    return jsonify({'error': 'Payment not found'}), 404

@app.route('/payments', methods=['POST'])
def create_payment():
    data = request.get_json()
    if not data or 'order_id' not in data or 'amount' not in data:
        return jsonify({'error': 'Invalid input, order_id and amount are required'}), 400
        
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
        
    cursor = conn.cursor()
    sql = '''INSERT INTO payments (order_id, amount, status, payment_method) 
             VALUES (%s, %s, %s, %s)'''
    val = (
        data['order_id'], 
        data['amount'], 
        data.get('status', 'pending'), 
        data.get('payment_method')
    )
    
    cursor.execute(sql, val)
    conn.commit()
    new_id = cursor.lastrowid
    
    cursor.close()
    conn.close()
    
    return jsonify({
        'id': new_id,
        'order_id': data['order_id'],
        'amount': data['amount'],
        'status': data.get('status', 'pending'),
        'payment_method': data.get('payment_method')
    }), 201

@app.route('/payments/<int:payment_id>', methods=['PUT'])
def update_payment(payment_id):
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Invalid input'}), 400
        
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
        
    cursor = conn.cursor(dictionary=True)
    
    # Check if exists
    cursor.execute('SELECT * FROM payments WHERE id = %s', (payment_id,))
    payment = cursor.fetchone()
    if not payment:
        cursor.close()
        conn.close()
        return jsonify({'error': 'Payment not found'}), 404
        
    sql = '''UPDATE payments 
             SET order_id = %s, amount = %s, status = %s, payment_method = %s 
             WHERE id = %s'''
    val = (
        data.get('order_id', payment['order_id']),
        data.get('amount', payment['amount']),
        data.get('status', payment['status']),
        data.get('payment_method', payment['payment_method']),
        payment_id
    )
    
    cursor.execute(sql, val)
    conn.commit()
    
    cursor.execute('SELECT * FROM payments WHERE id = %s', (payment_id,))
    updated_payment = cursor.fetchone()
    
    cursor.close()
    conn.close()
    
    return jsonify(updated_payment), 200

@app.route('/payments/<int:payment_id>', methods=['DELETE'])
def delete_payment(payment_id):
    conn = get_db_connection()
    if not conn:
        return jsonify({'error': 'Database connection failed'}), 500
        
    cursor = conn.cursor()
    cursor.execute('DELETE FROM payments WHERE id = %s', (payment_id,))
    conn.commit()
    
    affected_rows = cursor.rowcount
    
    cursor.close()
    conn.close()
    
    if affected_rows == 0:
        return jsonify({'error': 'Payment not found'}), 404
        
    return jsonify({'message': 'Payment deleted successfully'}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
