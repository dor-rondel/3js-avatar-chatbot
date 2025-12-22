import type { JSX } from 'react';
import type { GLTF } from 'three-stdlib';
import type { Group, MeshStandardMaterial, SkinnedMesh } from 'three';

export type GLTFResult = GLTF & {
  nodes: {
    Hips: Group;
    EyeLeft: SkinnedMesh;
    EyeRight: SkinnedMesh;
    Wolf3D_Head: SkinnedMesh;
    Wolf3D_Teeth: SkinnedMesh;
    Wolf3D_Hair: SkinnedMesh;
    Wolf3D_Glasses: SkinnedMesh;
    Wolf3D_Outfit_Top: SkinnedMesh;
    Wolf3D_Outfit_Bottom: SkinnedMesh;
    Wolf3D_Outfit_Footwear: SkinnedMesh;
    Wolf3D_Body: SkinnedMesh;
  };
  materials: {
    Wolf3D_Eye: MeshStandardMaterial;
    Wolf3D_Skin: MeshStandardMaterial;
    Wolf3D_Teeth: MeshStandardMaterial;
    Wolf3D_Hair: MeshStandardMaterial;
    Wolf3D_Glasses: MeshStandardMaterial;
    Wolf3D_Outfit_Top: MeshStandardMaterial;
    Wolf3D_Outfit_Bottom: MeshStandardMaterial;
    Wolf3D_Outfit_Footwear: MeshStandardMaterial;
    Wolf3D_Body: MeshStandardMaterial;
  };
};

export type GroupProps = JSX.IntrinsicElements['group'];
