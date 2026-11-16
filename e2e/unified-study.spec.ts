import {test,expect} from "@playwright/test";
test("unified study restores component picker and reset",async({page})=>{
 await page.goto("/decision-lab/");
 const section=page.locator("#decision-items");
 await expect(section.getByRole("heading",{name:"Luồng nghiên cứu thống nhất"})).toBeVisible();
 const component=section.getByRole("button",{name:/^Thêm /}).first();
 await component.click();await component.click();
 await expect(section.getByRole("heading",{name:"2. Mảnh trang bị (2/8)"})).toBeVisible();
 await section.getByRole("button",{name:"Xóa hết",exact:true}).click();
 await expect(section.getByRole("heading",{name:"2. Mảnh trang bị (0/8)"})).toBeVisible();
 await section.getByRole("combobox",{name:"Nhóm kỳ ngộ"}).selectOption("Nhiều trang bị");
 await expect(section.getByText(/lobby cũng có thêm sức mạnh/)).toBeVisible();
});
