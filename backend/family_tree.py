from __future__ import annotations
from typing import Dict, Set, List, Tuple, Optional, Any, Union
from collections import defaultdict, deque
import json

# Relationship weights and labels
RELATIONSHIP_LABELS = {
    13: "Parent",
    14: "Son-Daughter",
    12: "Sibling",
    11: "Married",
    10: "Divorced",
}
RELATIONSHIP_LABELS_INV = {v: k for k, v in RELATIONSHIP_LABELS.items()}

class Person:
    def __init__(self, mid: str, name: str, gender: str, age: int):
        self.mid = mid  # unique member ID
        self.name = name
        self.gender = gender
        self.age = age

    def __hash__(self):
        return hash(self.mid)

    def __eq__(self, other):
        return isinstance(other, Person) and self.mid == other.mid

    def __repr__(self):
        return f"Person(mid={self.mid!r}, name={self.name!r}, gender={self.gender!r}, age={self.age!r})"

    def to_dict(self):
        return {
            "mid": self.mid,
            "name": self.name,
            "gender": self.gender,
            "age": self.age,
        }

    @staticmethod
    def from_dict(data: Dict[str, Any]) -> Person:
        return Person(data["mid"], data["name"], data["gender"], data["age"])

class FamilyTree:
    def __init__(self):
        self.persons: Dict[str, Person] = {}  # mid -> Person
        self.graph: Dict[str, Dict[str, int]] = defaultdict(dict)  # mid -> {mid: relationship_weight}

    # === Person Management ===
    def add_person(self, person: Person) -> None:
        self.persons[person.mid] = person

    def edit_person(self, mid: str, name: Optional[str] = None, gender: Optional[str] = None, age: Optional[int] = None) -> None:
        if mid not in self.persons:
            raise ValueError(f"Person {mid} not found.")
        p = self.persons[mid]
        if name: p.name = name
        if gender: p.gender = gender
        if age is not None: p.age = age

    def delete_person(self, mid: str) -> None:
        if mid not in self.persons:
            raise ValueError(f"Person {mid} not found.")
        del self.persons[mid]
        self.graph.pop(mid, None)
        for rels in self.graph.values():
            rels.pop(mid, None)

    # === Relationship Management ===
    def add_relationship(self, mid1: str, mid2: str, relationship: Union[int, str]) -> None:
        """
        Add a relationship between two people.
        The relationship is FROM mid1 TO mid2.
        Examples:
        - add_relationship(parent_id, child_id, "Parent") -> parent becomes parent of child
        - add_relationship(spouse1_id, spouse2_id, "Married") -> they become married
        - add_relationship(sibling1_id, sibling2_id, "Sibling") -> they become siblings
        """
        if isinstance(relationship, str):
            weight = RELATIONSHIP_LABELS_INV[relationship]
        else:
            weight = relationship
            
        if mid1 not in self.persons or mid2 not in self.persons:
            raise ValueError("Both persons must exist.")
            
        if mid1 == mid2:
            raise ValueError("Cannot create relationship with self.")
            
        # Check for existing relationship
        if mid1 in self.graph and mid2 in self.graph[mid1]:
            raise ValueError(f"Relationship already exists between {self.persons[mid1].name} and {self.persons[mid2].name}.")
            
        # Add the primary relationship
        self.graph[mid1][mid2] = weight
        
        # Automatically add complementary relationships
        if weight == 13:  # Parent -> automatically add Son-Daughter
            self.graph[mid2][mid1] = 14
            # Auto-create sibling relationships between children
            self._auto_create_sibling_relationships(mid1)
        elif weight == 14:  # Son-Daughter -> automatically add Parent
            self.graph[mid2][mid1] = 13
            # Auto-create sibling relationships between children
            self._auto_create_sibling_relationships(mid2)
        elif weight == 12:  # Sibling -> bidirectional
            self.graph[mid2][mid1] = 12
        elif weight == 11:  # Married -> bidirectional
            self.graph[mid2][mid1] = 11
        elif weight == 10:  # Divorced -> bidirectional
            self.graph[mid2][mid1] = 10

    def _auto_create_sibling_relationships(self, parent_mid: str) -> None:
        """Automatically create sibling relationships between all children of a parent."""
        children = self._get_by_relationship(parent_mid, 14)  # Get all children
        if len(children) > 1:
            # Create sibling relationships between all children
            for i, child1 in enumerate(children):
                for child2 in children[i+1:]:
                    # Only add if not already exists
                    if child1 not in self.graph or child2 not in self.graph[child1]:
                        self.graph[child1][child2] = 12  # Sibling
                    if child2 not in self.graph or child1 not in self.graph[child2]:
                        self.graph[child2][child1] = 12  # Sibling

    def add_parent_child_relationship(self, parent_mid: str, child_mid: str) -> None:
        """
        Simplified method to add parent-child relationship.
        This automatically handles the bidirectional relationship and sibling creation.
        """
        if parent_mid not in self.persons or child_mid not in self.persons:
            raise ValueError("Both persons must exist.")
            
        if parent_mid == child_mid:
            raise ValueError("Cannot create relationship with self.")
            
        # Check for cycles
        if self.is_ancestor(child_mid, parent_mid):
            raise ValueError("Adding this parent relationship would create a cycle.")
            
        # Add parent relationship (which automatically adds child relationship)
        self.add_relationship(parent_mid, child_mid, "Parent")

    def add_marriage_relationship(self, spouse1_mid: str, spouse2_mid: str) -> None:
        """
        Simplified method to add marriage relationship.
        This automatically handles the bidirectional relationship.
        """
        if spouse1_mid not in self.persons or spouse2_mid not in self.persons:
            raise ValueError("Both persons must exist.")
            
        if spouse1_mid == spouse2_mid:
            raise ValueError("Cannot create relationship with self.")
            
        # Add marriage relationship (which automatically adds bidirectional)
        self.add_relationship(spouse1_mid, spouse2_mid, "Married")

    def add_sibling_relationship(self, sibling1_mid: str, sibling2_mid: str) -> None:
        """
        Simplified method to add sibling relationship.
        This automatically handles the bidirectional relationship.
        """
        if sibling1_mid not in self.persons or sibling2_mid not in self.persons:
            raise ValueError("Both persons must exist.")
            
        if sibling1_mid == sibling2_mid:
            raise ValueError("Cannot create relationship with self.")
            
        # Add sibling relationship (which automatically adds bidirectional)
        self.add_relationship(sibling1_mid, sibling2_mid, "Sibling")

    def edit_relationship(self, mid1: str, mid2: str, new_relationship: Union[int, str]) -> None:
        self.delete_relationship(mid1, mid2)
        self.add_relationship(mid1, mid2, new_relationship)

    def delete_relationship(self, mid1: str, mid2: str) -> None:
        weight = self.graph[mid1].get(mid2)
        if weight is None:
            return
        del self.graph[mid1][mid2]
        # Remove complementary/symmetric
        if weight == 13 and mid2 in self.graph and mid1 in self.graph[mid2]:
            if self.graph[mid2][mid1] == 14:
                del self.graph[mid2][mid1]
        elif weight == 14 and mid2 in self.graph and mid1 in self.graph[mid2]:
            if self.graph[mid2][mid1] == 13:
                del self.graph[mid2][mid1]
        elif weight in (12, 11, 10) and mid2 in self.graph and mid1 in self.graph[mid2]:
            if self.graph[mid2][mid1] == weight:
                del self.graph[mid2][mid1]

    # === Visualization ===
    def get_dot(self, start_mid: Optional[str] = None, depth: Optional[int] = None) -> str:
        if not self.persons:
            return "digraph FamilyTree { node [shape=box]; \"empty\" [label=\"No family members\"]; }"
            
        lines = [
            "digraph FamilyTree {",
            "  rankdir=TB;",  # Top to bottom layout
            "  node [shape=ellipse, style=filled, fillcolor=lightblue, fontname=\"Arial\", fontsize=10];",
            "  edge [fontname=\"Arial\", fontsize=8, color=gray];",
            "  graph [bgcolor=white, ranksep=0.8, nodesep=0.5];"
        ]
        
        visited = set()
        
        def add_edges(mid: str, cur_depth: int):
            if mid in visited:
                return
            visited.add(mid)
            
            if mid not in self.persons:
                return
                
            p = self.persons[mid]
            # Create node with better formatting
            node_label = f"{p.name}\\n({p.gender}, {p.age})"
            lines.append(f'  "{mid}" [label="{node_label}"]')
            
            if mid in self.graph:
                for to_mid, rel in self.graph[mid].items():
                    if to_mid in self.persons:  # Only add edges to existing persons
                        label = RELATIONSHIP_LABELS.get(rel, str(rel))
                        # Color code different relationship types
                        edge_color = "blue" if rel == 13 else "red" if rel == 14 else "green" if rel == 12 else "purple" if rel == 11 else "orange"
                        lines.append(f'  "{mid}" -> "{to_mid}" [label="{label}", color="{edge_color}"]')
                        if depth is None or cur_depth < depth:
                            add_edges(to_mid, cur_depth + 1)
        
        if start_mid:
            add_edges(start_mid, 0)
        else:
            # Start with root nodes (those with no parents)
            root_nodes = set(self.persons.keys())
            for mid, rels in self.graph.items():
                for to_mid, rel in rels.items():
                    if rel == 13:  # Parent relationship
                        root_nodes.discard(to_mid)
            
            for mid in root_nodes:
                add_edges(mid, 0)
                
            # Add any remaining unvisited nodes
            for mid in self.persons:
                if mid not in visited:
                    add_edges(mid, 0)
        
        lines.append("}")
        return "\n".join(lines)

    # === JSON Support ===
    def export_to_json(self) -> str:
        data = {
            "persons": [p.to_dict() for p in self.persons.values()],
            "edges": [
                {"from": mid1, "to": mid2, "relationship": rel}
                for mid1, rels in self.graph.items()
                for mid2, rel in rels.items()
            ]
        }
        return json.dumps(data)

    @staticmethod
    def import_from_json(json_obj: Union[str, Dict[str, Any]]) -> FamilyTree:
        if isinstance(json_obj, str):
            data = json.loads(json_obj)
        else:
            data = json_obj
        tree = FamilyTree()
        for p in data["persons"]:
            tree.add_person(Person.from_dict(p))
        for edge in data["edges"]:
            tree.add_relationship(edge["from"], edge["to"], edge["relationship"])
        return tree

    # === Merge Support ===
    def merge_with(self, other_tree: FamilyTree, link: Optional[Tuple[str, str, Union[int, str]]] = None) -> None:
        # Ensure unique IDs
        for mid, person in other_tree.persons.items():
            if mid in self.persons:
                raise ValueError(f"Duplicate member ID {mid} in merge.")
            self.add_person(person)
        for mid1, rels in other_tree.graph.items():
            for mid2, rel in rels.items():
                self.graph[mid1][mid2] = rel
        if link:
            self.add_relationship(*link)

    # === Inference Utilities ===
    def _get_neighbors(self, mid: str, rel_types: Optional[Set[int]] = None) -> Set[str]:
        neighbors = set()
        for to_mid, rel in self.graph.get(mid, {}).items():
            if rel_types is None or rel in rel_types:
                neighbors.add(to_mid)
        return neighbors

    def _get_by_relationship(self, mid: str, rel_type: int) -> Set[str]:
        return {to_mid for to_mid, rel in self.graph.get(mid, {}).items() if rel == rel_type}

    # === Inferred Relationship Queries ===
    def get_immediate_family(self, mid: str) -> Dict[str, List[Person]]:
        parents = [self.persons[m] for m in self._get_by_relationship(mid, 13)]
        children = [self.persons[m] for m in self._get_by_relationship(mid, 14)]
        siblings = [self.persons[m] for m in self._get_by_relationship(mid, 12)]
        spouses = [self.persons[m] for m in self._get_by_relationship(mid, 11)]
        return {
            "parents": parents,
            "children": children,
            "siblings": siblings,
            "spouses": spouses,
        }

    def get_grandparents(self, mid: str) -> List[Person]:
        grandparents = set()
        for parent in self._get_by_relationship(mid, 13):
            grandparents.update(self._get_by_relationship(parent, 13))
        return [self.persons[m] for m in grandparents]

    def get_grandchildren(self, mid: str) -> List[Person]:
        grandchildren = set()
        for child in self._get_by_relationship(mid, 14):
            grandchildren.update(self._get_by_relationship(child, 14))
        return [self.persons[m] for m in grandchildren]

    def get_uncles_and_aunts(self, mid: str) -> List[Person]:
        uncles_aunts = set()
        for parent in self._get_by_relationship(mid, 13):
            uncles_aunts.update(self._get_by_relationship(parent, 12))
        return [self.persons[m] for m in uncles_aunts]

    def get_cousins(self, mid: str) -> List[Person]:
        cousins = set()
        for parent in self._get_by_relationship(mid, 13):
            for sibling in self._get_by_relationship(parent, 12):
                cousins.update(self._get_by_relationship(sibling, 14))
        return [self.persons[m] for m in cousins]

    def get_nieces_and_nephews(self, mid: str) -> List[Person]:
        nieces_nephews = set()
        for sibling in self._get_by_relationship(mid, 12):
            nieces_nephews.update(self._get_by_relationship(sibling, 14))
        return [self.persons[m] for m in nieces_nephews]

    def get_in_laws(self, mid: str) -> List[Person]:
        inlaws = set()
        for spouse in self._get_by_relationship(mid, 11):
            inlaws.update(self._get_by_relationship(spouse, 12))  # spouse's siblings
            inlaws.update(self._get_by_relationship(spouse, 13))  # spouse's parents
        return [self.persons[m] for m in inlaws]

    def get_common_ancestors(self, mid1: str, mid2: str) -> List[Person]:
        """Get all common ancestors between two people."""
        def get_ancestors(mid: str) -> Set[str]:
            visited = set()
            stack = [mid]
            while stack:
                curr = stack.pop()
                for parent in self._get_by_relationship(curr, 13):
                    if parent not in visited:
                        visited.add(parent)
                        stack.append(parent)
            return visited
        a1 = get_ancestors(mid1)
        a2 = get_ancestors(mid2)
        return [self.persons[m] for m in a1 & a2]

    def get_generation_gap(self, mid1: str, mid2: str) -> Optional[int]:
        # BFS from mid1 to mid2, count parent/child steps
        queue = deque([(mid1, 0)])
        visited = set([mid1])
        while queue:
            curr, depth = queue.popleft()
            if curr == mid2:
                return depth
            for rel in (13, 14):
                for neighbor in self._get_by_relationship(curr, rel):
                    if neighbor not in visited:
                        visited.add(neighbor)
                        queue.append((neighbor, depth + 1))
        return None

    def are_cousins(self, mid1: str, mid2: str) -> bool:
        gp1 = {p.mid for p in self.get_grandparents(mid1)}
        gp2 = {p.mid for p in self.get_grandparents(mid2)}
        return len(gp1 & gp2) > 0

    def is_ancestor(self, ancestor_mid: str, descendant_mid: str) -> bool:
        # DFS
        visited = set()
        def dfs(mid: str) -> bool:
            if mid == ancestor_mid:
                return True
            if mid in visited:
                return False
            visited.add(mid)
            for to_mid, rel in self.graph.get(mid, {}).items():
                if rel == 13:  # Parent relationship
                    if dfs(to_mid):
                        return True
            return False
        return dfs(descendant_mid)

    def would_create_cycle(self, parent_mid: str, child_mid: str) -> bool:
        """Check if adding a parent relationship would create a cycle."""
        # Check if child is already an ancestor of the parent
        return self.is_ancestor(child_mid, parent_mid)

    def get_relationship_path(self, mid1: str, mid2: str) -> Optional[List[Tuple[str, str, str]]]:
        # Check if both persons exist
        if mid1 not in self.persons or mid2 not in self.persons:
            return None
            
        # BFS for shortest path, return [(from_mid, to_mid, relationship_label)]
        queue = deque([(mid1, [])])
        visited = set([mid1])
        while queue:
            curr, path = queue.popleft()
            if curr == mid2:
                # Build the path from the BFS result
                result_path = []
                for i in range(len(path)):
                    from_mid = path[i][0]
                    to_mid = path[i][1]
                    rel_weight = self.graph[from_mid][to_mid]
                    rel_label = RELATIONSHIP_LABELS.get(rel_weight, str(rel_weight))
                    result_path.append((from_mid, to_mid, rel_label))
                return result_path
            for to_mid, rel in self.graph.get(curr, {}).items():
                if to_mid not in visited:
                    visited.add(to_mid)
                    queue.append((to_mid, path + [(curr, to_mid)]))
        return None

    # === Utility ===
    def get_person(self, mid: str) -> Optional[Person]:
        return self.persons.get(mid)

    def get_relationship_type(self, mid1: str, mid2: str) -> Optional[str]:
        """
        Returns the specific relationship type between two people.
        Returns None if no relationship found.
        """
        if mid1 not in self.persons or mid2 not in self.persons:
            return None
            
        # Check if they are the same person
        if mid1 == mid2:
            return "self"
            
        # Get the shortest path between them
        path = self.get_relationship_path(mid1, mid2)
        if not path:
            return None
            
        # Analyze the path to determine relationship
        return self._analyze_relationship_path(mid1, mid2, path)
    
    def _analyze_relationship_path(self, mid1: str, mid2: str, path: List[Tuple[str, str, str]]) -> str:
        """Analyze relationship path to determine specific relationship type."""
        if not path:
            return None
            
        # Get person objects
        person1 = self.persons[mid1]
        person2 = self.persons[mid2]
        
        # Direct relationships
        if len(path) == 1:
            rel = path[0][2]
            if rel == "Parent":
                return "father" if person2.gender == "M" else "mother"
            elif rel == "Son-Daughter":
                return "son" if person2.gender == "M" else "daughter"
            elif rel == "Sibling":
                return "brother" if person2.gender == "M" else "sister"
            elif rel == "Married":
                return "husband" if person2.gender == "M" else "wife"
            elif rel == "Divorced":
                return "ex-husband" if person2.gender == "M" else "ex-wife"
        
        # Multi-step relationships
        rel_sequence = [step[2] for step in path]
        
        # Grandparent relationships
        if rel_sequence == ["Parent", "Parent"]:
            return "grandfather" if person2.gender == "M" else "grandmother"
        elif rel_sequence == ["Son-Daughter", "Son-Daughter"]:
            return "grandson" if person2.gender == "M" else "granddaughter"
        
        # Great-grandparent relationships
        if rel_sequence == ["Parent", "Parent", "Parent"]:
            return "great-grandfather" if person2.gender == "M" else "great-grandmother"
        elif rel_sequence == ["Son-Daughter", "Son-Daughter", "Son-Daughter"]:
            return "great-grandson" if person2.gender == "M" else "great-granddaughter"
        
        # Uncle/Aunt relationships
        if rel_sequence == ["Parent", "Sibling"]:
            return "uncle" if person2.gender == "M" else "aunt"
        elif rel_sequence == ["Sibling", "Son-Daughter"]:
            return "nephew" if person2.gender == "M" else "niece"
        
        # Cousin relationships
        if rel_sequence == ["Parent", "Sibling", "Son-Daughter"]:
            return "cousin"
        
        # In-law relationships
        if rel_sequence == ["Married", "Parent"]:
            return "father-in-law" if person2.gender == "M" else "mother-in-law"
        elif rel_sequence == ["Married", "Sibling"]:
            return "brother-in-law" if person2.gender == "M" else "sister-in-law"
        elif rel_sequence == ["Sibling", "Married"]:
            return "brother-in-law" if person2.gender == "M" else "sister-in-law"
        
        # Step relationships
        if rel_sequence == ["Parent", "Married"]:
            return "stepfather" if person2.gender == "M" else "stepmother"
        elif rel_sequence == ["Son-Daughter", "Married"]:
            return "stepson" if person2.gender == "M" else "stepdaughter"
        
        # More distant relationships
        if len(rel_sequence) > 3:
            # Count generations up and down
            up_count = rel_sequence.count("Parent")
            down_count = rel_sequence.count("Son-Daughter")
            
            if up_count > 2:
                return f"{'great-' * (up_count - 2)}grandfather" if person2.gender == "M" else f"{'great-' * (up_count - 2)}grandmother"
            elif down_count > 2:
                return f"{'great-' * (down_count - 2)}grandson" if person2.gender == "M" else f"{'great-' * (down_count - 2)}granddaughter"
            else:
            return "distant relative"
        
        return "relative"
    
    def get_relationship_with_path(self, mid1: str, mid2: str) -> Dict[str, Any]:
        """
        Get relationship type and path for complex relationships.
        Returns: {"relationship": "relationship_type", "path": "relationship_path_description"}
        """
        if mid1 not in self.persons or mid2 not in self.persons:
            return {"relationship": None, "path": None}
            
        # Check if they are the same person
        if mid1 == mid2:
            return {"relationship": "self", "path": "same person"}
            
        # Get the shortest path between them
        path = self.get_relationship_path(mid1, mid2)
        if not path:
            return {"relationship": None, "path": None}
            
        # Get basic relationship
        relationship = self._analyze_relationship_path(mid1, mid2, path)
        
        # For simple relationships, no need for path
        if len(path) <= 2:
            return {"relationship": relationship, "path": None}
        
        # For complex relationships, provide path description
        path_description = self._describe_relationship_path(mid1, mid2, path)
        
        return {
            "relationship": relationship,
            "path": path_description
        }
    
    def _describe_relationship_path(self, mid1: str, mid2: str, path: List[Tuple[str, str, str]]) -> str:
        """Create a human-readable description of the relationship path."""
        if not path:
        return None
            
        person1 = self.persons[mid1]
        person2 = self.persons[mid2]
        
        path_steps = []
        for step in path:
            from_person = self.persons[step[0]]
            to_person = self.persons[step[1]]
            rel_type = step[2]
            
            if rel_type == "Parent":
                rel_desc = "parent of" if from_person.gender == "M" else "mother of"
            elif rel_type == "Son-Daughter":
                rel_desc = "child of"
            elif rel_type == "Sibling":
                rel_desc = "sibling of"
            elif rel_type == "Married":
                rel_desc = "married to"
            elif rel_type == "Divorced":
                rel_desc = "divorced from"
            else:
                rel_desc = rel_type.lower() + " of"
            
            path_steps.append(f"{from_person.name} is {rel_desc} {to_person.name}")
        
        return " → ".join(path_steps)
    
    def get_bidirectional_relationship(self, mid1: str, mid2: str) -> Dict[str, str]:
        """
        Get relationship in both directions.
        Returns: {"forward": "relationship from mid1 to mid2", "reverse": "relationship from mid2 to mid1"}
        """
        forward = self.get_relationship_type(mid1, mid2)
        reverse = self.get_relationship_type(mid2, mid1)
        
        return {
            "forward": forward,
            "reverse": reverse
        }
    
    def get_detailed_relationship_info(self, mid1: str, mid2: str) -> Dict[str, Any]:
        """
        Get comprehensive relationship information between two people.
        """
        if mid1 not in self.persons or mid2 not in self.persons:
            return {"error": "One or both persons not found"}
            
        person1 = self.persons[mid1]
        person2 = self.persons[mid2]
        
        # Get basic relationship
        relationship = self.get_relationship_type(mid1, mid2)
        
        # Get common ancestors
        common_ancestors = self.get_common_ancestors(mid1, mid2)
        
        # Get relationship path
        path = self.get_relationship_path(mid1, mid2)
        
        # Check if they are related at all
        is_related = relationship is not None and relationship != "self"
        
        return {
            "person1": person1.to_dict(),
            "person2": person2.to_dict(),
            "relationship": relationship,
            "is_related": is_related,
            "common_ancestors": [p.to_dict() for p in common_ancestors],
            "relationship_path": path,
            "bidirectional": self.get_bidirectional_relationship(mid1, mid2)
        }

    def detect_ancestry_cycles(self) -> List[List[str]]:
        """
        Detects cycles in the ancestry graph (parent relationships only).
        Returns a list of cycles, each as a list of member IDs. Empty list if no cycles.
        """
        cycles = []
        visited = set()
        stack = set()
        path = []

        def dfs(mid: str):
            if mid in stack:
                # Found a cycle, record the cycle path
                idx = path.index(mid)
                cycles.append(path[idx:] + [mid])
                return
            if mid in visited:
                return
            visited.add(mid)
            stack.add(mid)
            path.append(mid)
            for parent in self._get_by_relationship(mid, 13):
                dfs(parent)
            stack.remove(mid)
            path.pop()

        for mid in self.persons:
            dfs(mid)
        return cycles