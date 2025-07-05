import os
import hashlib
import uuid
import json
from datetime import timedelta
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from pymongo import MongoClient
from family_tree import Person, FamilyTree
import csv
import io
import tempfile

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = "your-secret-key"
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=24)

CORS(app, resources={r"/*": {"origins": "*"}})
jwt = JWTManager(app)

client = MongoClient('mongodb://localhost:27017/')
db = client['family_tree_db']
trees_collection = db['trees']

user_trees = {}

@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"msg": "Token has expired"}), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"msg": "Invalid token"}), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({"msg": "Missing token"}), 401

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    email = data.get('email')
    
    if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400
    
    existing_user = trees_collection.find_one({"username": username})
    if existing_user:
        return jsonify({"msg": "Username already exists"}), 400
    
    new_user = {
        "username": username,
        "password": password,
        "email": email,
        "tree": FamilyTree().to_dict()
    }

    trees_collection.insert_one(new_user)
    return jsonify({"msg": "User registered successfully"}), 201

@app.route('/login', methods=['POST'])
def login():
        data = request.get_json()
    username = data.get('username')
    password = data.get('password')
        
        if not username or not password:
        return jsonify({"msg": "Username and password required"}), 400
    
    user = trees_collection.find_one({"username": username, "password": password})
    if not user:
        return jsonify({"msg": "Invalid credentials"}), 401
    
        access_token = create_access_token(identity=username)
    
    tree = FamilyTree()
    tree.from_dict(user.get('tree', {}))
    user_trees[username] = tree
    
    return jsonify({
        "access_token": access_token,
        "msg": "Login successful"
    }), 200

def get_current_user_tree():
    username = get_jwt_identity()
    if username not in user_trees:
        user = trees_collection.find_one({"username": username})
        if user:
            tree = FamilyTree()
            tree.from_dict(user.get('tree', {}))
            user_trees[username] = tree
        else:
            user_trees[username] = FamilyTree()
    return user_trees[username]

@app.route('/members', methods=['GET'])
@jwt_required()
def get_members():
    tree = get_current_user_tree()
    members = list(tree.persons.values())
    return jsonify(members)

@app.route('/members', methods=['POST'])
@jwt_required()
def add_member():
    tree = get_current_user_tree()
    data = request.get_json()
    
    name = data.get('name')
    age = data.get('age', 0)
    gender = data.get('gender', 'O')
    
    if not name:
        return jsonify({"msg": "Name is required"}), 400
    
    member = tree.add_person(name, age, gender)
    
    user = get_jwt_identity()
    trees_collection.update_one(
        {"username": user},
        {"$set": {"tree": tree.to_dict()}}
    )
    
    return jsonify(member), 201

@app.route('/members/<mid>', methods=['PUT'])
@jwt_required()
def update_member(mid):
    tree = get_current_user_tree()
    data = request.get_json()
    
    if mid not in tree.persons:
        return jsonify({"msg": "Member not found"}), 404
    
    person = tree.persons[mid]
    person.name = data.get('name', person.name)
    person.age = data.get('age', person.age)
    person.gender = data.get('gender', person.gender)
    
    user = get_jwt_identity()
    trees_collection.update_one(
        {"username": user},
        {"$set": {"tree": tree.to_dict()}}
    )
    
    return jsonify(person)

@app.route('/relationships', methods=['POST'])
@jwt_required()
def add_relationship():
    tree = get_current_user_tree()
    data = request.get_json()
    
    from_mid = data.get('from')
    to_mid = data.get('to')
    relationship_type = data.get('relationship')
    
    if not all([from_mid, to_mid, relationship_type]):
        return jsonify({"msg": "from, to, and relationship are required"}), 400
    
    if from_mid not in tree.persons or to_mid not in tree.persons:
        return jsonify({"msg": "One or both members not found"}), 404
    
    if tree.has_relationship(from_mid, to_mid):
        return jsonify({"msg": "Relationship already exists"}), 400
    
    tree.add_relationship(from_mid, to_mid, relationship_type)
    
    user = get_jwt_identity()
    trees_collection.update_one(
        {"username": user},
        {"$set": {"tree": tree.to_dict()}}
    )
    
    return jsonify({"msg": "Relationship added successfully"}), 201

@app.route('/relatives/<mid>', methods=['GET'])
@jwt_required()
def get_relatives(mid):
    tree = get_current_user_tree()
    
    if mid not in tree.persons:
        return jsonify({"msg": "Member not found"}), 404
    
    relatives = tree.get_relatives(mid)
    relative_members = [tree.persons[rel_mid] for rel_mid in relatives if rel_mid in tree.persons]
    
    return jsonify(relative_members)

@app.route('/export_json', methods=['GET'])
@jwt_required()
def export_json():
    tree = get_current_user_tree()
    return jsonify(tree.to_dict())

@app.route('/export_dot', methods=['GET'])
@jwt_required()
def export_dot():
    tree = get_current_user_tree()
    return jsonify({"dot": tree.to_dot()})

@app.route('/merge', methods=['POST'])
@jwt_required()
def merge_trees():
    current_username = get_jwt_identity()
    data = request.get_json()
    target_username = data.get('target_username')
    
    if not target_username:
        return jsonify({"msg": "target_username is required"}), 400
    
    current_tree = get_current_user_tree()
    target_user = trees_collection.find_one({"username": target_username})
    
    if not target_user:
        return jsonify({"msg": "Target user not found"}), 404
    
    target_tree = FamilyTree()
    target_tree.from_dict(target_user.get('tree', {}))
    
    current_tree.merge(target_tree)
    
    trees_collection.update_one(
        {"username": current_username},
        {"$set": {"tree": current_tree.to_dict()}}
    )
    
    return jsonify({"msg": "Trees merged successfully"})

@app.route('/export_csv', methods=['GET'])
@jwt_required()
def export_csv():
    tree = get_current_user_tree()
    
    members_csv = StringIO()
    members_writer = csv.writer(members_csv)
    members_writer.writerow(['mid', 'name', 'age', 'gender'])
    for person in tree.persons.values():
        members_writer.writerow([person.mid, person.name, person.age, person.gender])
    
    edges_csv = StringIO()
    edges_writer = csv.writer(edges_csv)
    edges_writer.writerow(['from', 'to', 'relationship'])
    for from_mid, relationships in tree.graph.items():
        for to_mid, weight in relationships.items():
            edges_writer.writerow([from_mid, to_mid, weight])
    
    return jsonify({
        "members": members_csv.getvalue(),
        "edges": edges_csv.getvalue()
    })

@app.route('/kinship/relationship', methods=['POST'])
@jwt_required()
def get_relationship():
    tree = get_current_user_tree()
    data = request.get_json()
    
    person1_id = data.get('person1')
    person2_id = data.get('person2')
    
    if not person1_id or not person2_id:
        return jsonify({"msg": "person1 and person2 are required"}), 400
    
    if person1_id not in tree.persons or person2_id not in tree.persons:
        return jsonify({"msg": "One or both persons not found"}), 404
    
    result = tree.get_relationship_analysis(person1_id, person2_id)
    return jsonify(result)

@app.route('/kinship/common_ancestors', methods=['POST'])
@jwt_required()
def get_common_ancestors():
    tree = get_current_user_tree()
    data = request.get_json()
    
    person1_id = data.get('person1')
    person2_id = data.get('person2')
    
    if not person1_id or not person2_id:
        return jsonify({"msg": "person1 and person2 are required"}), 400
    
    if person1_id not in tree.persons or person2_id not in tree.persons:
        return jsonify({"msg": "One or both persons not found"}), 404
    
    ancestors = tree.get_common_ancestors(person1_id, person2_id)
    ancestor_persons = [tree.persons[anc_id] for anc_id in ancestors if anc_id in tree.persons]
    
    return jsonify(ancestor_persons)

@app.route('/kinship/bidirectional', methods=['POST'])
@jwt_required()
def get_bidirectional_relationship():
    tree = get_current_user_tree()
    data = request.get_json()
    
    person1_id = data.get('person1')
    person2_id = data.get('person2')
    
    if not person1_id or not person2_id:
        return jsonify({"msg": "person1 and person2 are required"}), 400
    
    if person1_id not in tree.persons or person2_id not in tree.persons:
        return jsonify({"msg": "One or both persons not found"}), 404
    
    result = tree.get_bidirectional_relationship(person1_id, person2_id)
    return jsonify(result)

@app.route('/kinship/comprehensive', methods=['POST'])
@jwt_required()
def get_comprehensive_analysis():
    tree = get_current_user_tree()
    data = request.get_json()
    
    person1_id = data.get('person1')
    person2_id = data.get('person2')
    
    if not person1_id or not person2_id:
        return jsonify({"msg": "person1 and person2 are required"}), 400
    
    if person1_id not in tree.persons or person2_id not in tree.persons:
        return jsonify({"msg": "One or both persons not found"}), 404
    
    result = tree.get_comprehensive_analysis(person1_id, person2_id)
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
