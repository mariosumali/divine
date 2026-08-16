"""Prepare the credited Poly by Google fortune-cookie mesh for DIVINE.

Run with Blender in background mode. The source mesh is bisected into two
independently animatable, capped shells, then exported as a compact GLB.
"""

from pathlib import Path
import sys

import bpy


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets" / "3d" / "fortune-cookie-source.glb"
OUTPUT = ROOT / "public" / "models" / "fortune-cookie.glb"


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def make_half(source, name, clear_inner, clear_outer):
    half = source.copy()
    half.data = source.data.copy()
    bpy.context.collection.objects.link(half)
    half.name = name
    half.data.name = f"{name}Geometry"
    select_only(half)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.bisect(
        plane_co=(0.0, 0.0, 0.0),
        plane_no=(1.0, 0.0, 0.0),
        use_fill=True,
        clear_inner=clear_inner,
        clear_outer=clear_outer,
        threshold=0.0001,
    )
    bpy.ops.object.mode_set(mode="OBJECT")

    bevel = half.modifiers.new(name="Baked edge", type="BEVEL")
    bevel.width = 0.22
    bevel.segments = 2
    bevel.limit_method = "ANGLE"
    bevel.angle_limit = 0.7
    for polygon in half.data.polygons:
        polygon.use_smooth = True
    return half


def main():
    if not SOURCE.exists():
        raise FileNotFoundError(SOURCE)

    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete(use_global=False)
    bpy.ops.import_scene.gltf(filepath=str(SOURCE))
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if len(meshes) != 1:
        raise RuntimeError(f"Expected one cookie mesh; found {len(meshes)}")

    source = meshes[0]
    left = make_half(source, "CookieLeft", clear_inner=False, clear_outer=True)
    right = make_half(source, "CookieRight", clear_inner=True, clear_outer=False)
    bpy.data.objects.remove(source, do_unlink=True)

    # Keep the source coordinate system. Runtime normalization uses the real
    # model bounds, so the object stays centered and cannot be clipped.
    select_only(left)
    right.select_set(True)
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=str(OUTPUT),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_yup=True,
    )
    print(f"Wrote {OUTPUT}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(error, file=sys.stderr)
        raise
