import { Field, Form, Formik } from "formik";
import { PrimitiveAtom, useAtomValue, useSetAtom } from "jotai";
import {
  categoriesAtom,
  categoriesAtomSplit,
  Category,
  categoryTypes,
} from "./category/category";
import { v7 as uuid } from "uuid";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

const columns: { key: keyof Category; label: string }[] = [
  {
    key: "icon",
    label: "Icon",
  },
  {
    key: "name",
    label: "Name",
  },
  {
    key: "type",
    label: "Typ",
  },
];

const rows: any[] = [];

export function Settings() {
  const categories = useAtomValue(categoriesAtomSplit);
  return (
    <>
      <h1 className="text-center">Einstellungen</h1>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Icon</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Typ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {categories.map((category) => (
              <Row category={category} key={category.toString()} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {/* <AddLayer /> */}
      {/* <Table>
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={categories}>
          {(item) => (
            <TableRow key={item.id} onClick={onOpen}>
              {(columnKey) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table> */}
    </>
  );
}

function Row({ category }: { category: PrimitiveAtom<Category> }) {
  // const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const item = useAtomValue(category);
  return (
    <TableRow key={item.id}>
      <TableCell>{item.icon}</TableCell>
      <TableCell>{item.name}</TableCell>
      <TableCell>{categoryTypes[item.type]}</TableCell>
    </TableRow>
  );
  // return (
  //   <>
  //     {}
  //     <TableRow key={item.id} onClick={onOpen}>
  //       {(columnKey) => <TableCell>{renderCell(item, columnKey)}</TableCell>}
  //     </TableRow>
  //     <EditLayer isOpen={isOpen} onOpenChange={onOpenChange} />
  //   </>
  // );
}

// function AddLayer() {
//   const { isOpen, onOpen, onOpenChange } = useDisclosure();
//   const setCategories = useSetAtom(categoriesAtom);
//   return (
//     <>
//       <Button color="primary" onPress={onOpen}>
//         +
//       </Button>
//       <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
//         <ModalContent>
//           {(onClose) => (
//             <>
//               <ModalHeader className="flex flex-col gap-1">
//                 Neue Kategorie
//               </ModalHeader>
//               <ModalBody>
//                 <Formik
//                   initialValues={{ name: "", type: "simple" } as Category}
//                   onSubmit={(values) => {
//                     setCategories((existing) => [
//                       ...existing,
//                       { ...values, id: uuid() },
//                     ]);
//                     onClose();
//                   }}
//                 >
//                   <Form>
//                     <Field name="icon" as={Input} label="Icon" />
//                     <Field name="name" as={Input} label="Name" />
//                     <Field name="type" as={TypeSelect} />
//                     <div className="flex justify-between mt-4">
//                       <Button color="danger" variant="light" onPress={onClose}>
//                         Abbrechen
//                       </Button>
//                       <Button color="primary" onPress={onClose} type="submit">
//                         Speichern
//                       </Button>
//                     </div>
//                   </Form>
//                 </Formik>
//               </ModalBody>
//             </>
//           )}
//         </ModalContent>
//       </Modal>
//     </>
//   );
// }

// function EditLayer({
//   isOpen,
//   onOpenChange,
// }: {
//   isOpen: boolean;
//   onOpenChange: () => void;
// }) {
//   const setCategories = useSetAtom(categoriesAtom);
//   return (
//     <>
//       <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
//         <ModalContent>
//           {(onClose) => (
//             <>
//               <ModalHeader className="flex flex-col gap-1">
//                 Neue Kategorie
//               </ModalHeader>
//               <ModalBody>
//                 <Formik
//                   initialValues={{ name: "", type: "simple" } as Category}
//                   onSubmit={(values) => {
//                     setCategories((existing) => [
//                       ...existing,
//                       { ...values, id: uuid() },
//                     ]);
//                     onClose();
//                   }}
//                 >
//                   <Form>
//                     <Field name="icon" as={Input} label="Icon" />
//                     <Field name="name" as={Input} label="Name" />
//                     <Field name="type" as={TypeSelect} />
//                     <div className="flex justify-between mt-4">
//                       <Button color="danger" variant="light" onPress={onClose}>
//                         Abbrechen
//                       </Button>
//                       <Button color="primary" onPress={onClose} type="submit">
//                         Speichern
//                       </Button>
//                     </div>
//                   </Form>
//                 </Formik>
//               </ModalBody>
//             </>
//           )}
//         </ModalContent>
//       </Modal>
//     </>
//   );
// }

// function TypeSelect({ value, ...props }: { value: string }) {
//   return (
//     <Select selectedKeys={[value]} {...props} label="Typ">
//       {Object.entries(categoryTypes).map(([value, label]) => (
//         <SelectItem key={value}>{label}</SelectItem>
//       ))}
//     </Select>
//   );
// }
