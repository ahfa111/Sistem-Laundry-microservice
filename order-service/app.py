from flask import Flask, request, jsonify
import json
import os
import uuid

app = Flask(__name__)
DB_FILE = 'order_db.json'

def load_data():
    if not os.path.exists(DB_FILE):
        return []
    try:
        with open(DB_FILE, 'r') as file:
            return json.load(file)
    except json.JSONDecodeError:
        return []

def save_data(data):
    with open(DB_FILE, 'w') as file:
        json.dump(data, file, indent=4)

@app.route('/orders', methods=['GET'])
def get_orders():
    orders = load_data()
    return jsonify({"status": "success", "data": orders}), 200

@app.route('/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    orders = load_data()
    order = next((o for o in orders if o.get('id') == order_id), None)
    if order:
        return jsonify({"status": "success", "data": order}), 200
    return jsonify({"status": "error", "message": "Order not found"}), 404

@app.route('/orders', methods=['POST'])
def create_order():
    orders = load_data()
    data = request.json
    
    new_order = {
        "id": str(uuid.uuid4()),
        "customer_id": data.get('customer_id'),
        "laundry_id": data.get('laundry_id'),
        "service_type": data.get('service_type'),
        "weight": data.get('weight'),
        "total_price": data.get('total_price'),
        "status": data.get('status', 'pending'),
        "order_date": data.get('order_date')
    }
    
    orders.append(new_order)
    save_data(orders)
    
    return jsonify({"status": "success", "data": new_order, "message": "Order created successfully"}), 201

@app.route('/orders/<order_id>', methods=['PUT'])
def update_order(order_id):
    orders = load_data()
    data = request.json
    
    for idx, order in enumerate(orders):
        if order.get('id') == order_id:
            orders[idx].update({
                "customer_id": data.get('customer_id', order.get('customer_id')),
                "laundry_id": data.get('laundry_id', order.get('laundry_id')),
                "service_type": data.get('service_type', order.get('service_type')),
                "weight": data.get('weight', order.get('weight')),
                "total_price": data.get('total_price', order.get('total_price')),
                "status": data.get('status', order.get('status')),
                "order_date": data.get('order_date', order.get('order_date'))
            })
            save_data(orders)
            return jsonify({"status": "success", "data": orders[idx], "message": "Order updated successfully"}), 200
            
    return jsonify({"status": "error", "message": "Order not found"}), 404

@app.route('/orders/<order_id>', methods=['DELETE'])
def delete_order(order_id):
    orders = load_data()
    new_orders = [o for o in orders if o.get('id') != order_id]
    
    if len(orders) == len(new_orders):
        return jsonify({"status": "error", "message": "Order not found"}), 404
        
    save_data(new_orders)
    return jsonify({"status": "success", "message": "Order deleted successfully"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
